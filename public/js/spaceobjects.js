const DEG2RAD = Math.PI / 180;//for conversions
const RAD2DEG = 180 / Math.PI;

import {Observer, Illumination,Equator,Body, SiderealTime} from "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.0/+esm";

//import Astronomy from "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.0/+esm";
//import stars from './stars-list.json' assert { type: 'json' };


const date = new Date();

const bodies = [
    Body.Sun,
    Body.Moon,
    Body.Mercury,
    Body.Venus,
    Body.Mars,
    Body.Jupiter,
    Body.Saturn,
    Body.Uranus,
    Body.Neptune,
];

async function loadStars() {//fetch star data from json
    const response = await fetch('./stars-list.json');
    if (!response.ok) {
        throw new Error("Failed to load stars");
    }
    return await response.json();
}

const stars = await loadStars();
//console.log(stars[0]);




function getRaDec(body, state) {
  //get right ascension and declenation of any body based on location
  const observer = new Observer(state.lat, state.lon, 0);//observer at these coordinates at sea level
  const eq = Equator(body, date, observer, true, true); //equator givers values including ra/dec
  return {raHours: eq.ra, decDeg: eq.dec};
}


function getMag(body) {//get apparent magnitude (brightness)
  return Illumination(body, date).mag;
}

export function getSiderealTime(){//get sidereal time (time relative to stars)
    return SiderealTime(date);
}


//math helper functions
function wrap360(deg) {
    deg = deg % 360;
    return deg < 0 ? deg + 360 : deg;
}
function wrap180(deg) {
    deg = ((deg + 180) % 360) - 180;
    return deg < -180 ? deg + 360 : deg;
}

// get Julian date from normal date using math formula
function julianDate(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // 1-12
    const day =date.getUTCDate() +(date.getUTCHours() +(date.getUTCMinutes() + (date.getUTCSeconds() + date.getUTCMilliseconds()/1000)/60)/60)/24;

    let Y = year;
    let M = month;
    if (M <= 2) { Y -= 1; M += 12; }

    const A = Math.floor(Y / 100);
    const B = 2 - A + Math.floor(A / 4);

    const JD = Math.floor(365.25 * (Y + 4716))+ Math.floor(30.6001 * (M + 1))+ day + B - 1524.5;

    return JD;
}

// get approx gmst degrees based on formula
function gmstDeg(date) {
    const JD = julianDate(date);
    const T = (JD - 2451545.0) / 36525.0;

    let gmst = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T*T - (T*T*T) / 38710000.0;``
    return wrap360(gmst);
}

// Convert RA/Dec to Alt/Az for observer at lat/lon and time
function raDecToAltAz(raHours, decDeg, state) {
    const latDeg = state.lat;
    const lonDeg = state.lon;

    const raDeg = raHours * 15;              
    const lst = wrap360(gmstDeg(date) + lonDeg); 
    const haDeg = wrap180(lst - raDeg);    

    const ha = haDeg * DEG2RAD;
    const dec = decDeg * DEG2RAD;
    const lat = latDeg * DEG2RAD;

    // Altitude (how high)
    const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
    const alt = Math.asin(sinAlt);

    // Azimuth (rotation starting from north)
    const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
    let az = Math.acos(Math.min(1, Math.max(-1, cosAz))); // clamp for numeric safety

    if (Math.sin(ha) > 0) az = 2 * Math.PI - az;

    return {
        altDeg: alt * RAD2DEG,
        azDeg: az * RAD2DEG,
        haDeg
    };
}


/*function visibleCoords(raHours, decDeg, state, minAltDeg = 15) {
  const altAz = raDecToAltAz(raHours, decDeg, state);
  if (altAz.altDeg > minAltDeg){
    return altAz;
  }
  else {
    return {altDeg: -1, azDeg: -1, haDeg: -1};
  }
}*/

export function brightestSpaceObjects(state){ //find all currently visible bright objects in order of magnitude
    const objs = [];
    for (const star of stars){//stars
        const altAz = raDecToAltAz(star.ra, star.dec, state);//find altitude
        if (altAz.altDeg>= 15){//if high enough to see, add to list
            objs.push({name: star.name + ": Star", ra: star.ra, dec: star.dec, mag: star.mag, altAz: altAz});//in order in json already
        }
    }

    for (const body of bodies){//solar system objects
        const raDec = getRaDec(body, state);
        const altAz = raDecToAltAz(raDec.raHours, raDec.decDeg, state);
        if (altAz.altDeg>= 15){//if high enough to see, add to list
            const index = binarySearchMagnitude(objs, getMag(body));
            let name = String(body);
            if (name ==="Moon" || name==="Sun"){
                name = "The " + name;
            }
            objs.splice(index, 0, {name: name + ": Solar System", ra: raDec.raHours, dec: raDec.decDeg, mag: getMag(body), altAz: altAz});
        }
    }
    return objs;
}

//use binary search to place solar system objects because they have non-constant magnitudes
function binarySearchMagnitude(objs, mag){
    let left = 0;
    let right = objs.length;
    while (left< right){
        const middle = Math.floor((left+right)/2);
        if (mag<objs[middle].mag){
            right = middle;
        }
        else{
            left = middle+1;
        }
    }
    return left;
}

//show list of bright objects in html
export function renderBrightestList(objects, skyMap) {
    const ul = document.getElementById("brightest-list");
    ul.innerHTML = ""; 

    objects.forEach((obj, i) => {
        const li = document.createElement("li");
        li.className = "list-item";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "list-btn";

        // store useful data for click
        btn.dataset.index = i;
        btn.dataset.name = obj.name;
        btn.dataset.ra = obj.ra;
        btn.dataset.dec = obj.dec;

        btn.innerHTML = `
        <span>${obj.name}</span>
        <span class="mag">${obj.mag.toFixed(2)}</span>
        `;
        btn.addEventListener("click", () => {//when button is clicked, highlight it and unhighlight others
            document.querySelectorAll(".list-btn.selected").forEach(el => el.classList.remove("selected"));
            btn.classList.add("selected");
            //highlightOnMap(obj);
            skyMap.setCenteredObj(obj);//set current selection to be the next object to go to if "go to" button is pressed
            const directions = document.getElementById("directions");
            
            //console.log(obj.altAz);
            // calculate where to look in sky to find selected object
            const cardinal = cardinalDirectionsFromAltAz(obj.altAz.azDeg);
            directions.textContent = `To find ${obj.name.split(":")[0]} outside, look ${cardinal} and ${Math.round(obj.altAz.altDeg)} degrees up.`;
            
        });

        li.appendChild(btn);
        ul.appendChild(li);
    });
}

function cardinalDirectionsFromAltAz(az) {//calculate cardinal directions from azimuth
    az = ((az % 360) + 360) % 360;
    az = Math.round(az);

    if (az <= 45) {
        return az + " degrees east of north";
    } 
    else if (az <= 90) {
        return (90 - az) + " degrees north of east";
    } 
    else if (az <= 135) {
        return (az - 90) + " degrees south of east";
    } 
    else if (az <= 180) {
        return (180 - az) + " degrees east of south";
    } 
    else if (az <= 225) {
        return (az - 180) + " degrees west of south";
    } 
    else if (az <= 270) {
        return (270 - az) + " degrees south of west";
    } 
    else if (az <= 315) {
        return (az - 270) + " degrees north of west";
    } 
    else {
        return (360 - az) + " degrees west of north";
    }
}

