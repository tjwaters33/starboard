import { Moon, Sun } from "./sunandmoon.js";
import { Skymap } from "./skymap.js";
import { brightestSpaceObjects, renderBrightestList} from "./spaceobjects.js"


const state = {
    lat: 0,
    lon: 0
};

const location = document.getElementById("location");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    } else { 
        location.innerHTML = "Geolocation unsupported.";
    }
    //console.log(state);
}

document.getElementById("use-location").addEventListener("click", getLocation);

function success(position) {
    state.lat = position.coords.latitude;
    state.lon = position.coords.longitude;
    location.innerHTML = "Current Location: " + state.lat.toFixed(3) +", " + state.lon.toFixed(3); 
    //console.log(state);
    needLocation();
}

function error() {
  alert("Sorry, no position available.");
}


function calculateScore(cloud_cover, temperature, transparency_est, wind_speed, now){
    let reasons = [];//reasons for scores lower than 100/100


    const sun = new Sun(now, state.lat, state.lon);
    const sunTimes = sun.getTimes();
    const sunrise_time = sunTimes[0];
    const sunset_time = sunTimes[1];
    const night_end = sunTimes[2];
    const night_start = sunTimes[3];
    //console.log(now, sunrise_time, sunset_time, night_end,night_start);

    //const now = new Date();
    //console.log(now, sunrise_time, sunset_time, night_end, night_start);
    //const diff_sunrise = hoursBetweenTimesOfDay(now, sunrise_time);
    //const diff_sunset  = hoursBetweenTimesOfDay(now, sunset_time);

    /*console.log(
        now.toLocaleTimeString(),
        sunset_time.toLocaleTimeString(),
        sunrise_time.toLocaleTimeString(),
        diff_sunrise.toFixed(2),
        diff_sunset.toFixed(2)
    );*/

    let adjDarkness = 1;// score scaler depending on darkness level, default to 1 (no penalty)
    if (now<night_start){
        if(now>night_end){
            if (now>sunrise_time && now<sunset_time){//sun is out
                adjDarkness = 0;
                reasons.push("sun being out");
            }
            else if (now<sunrise_time){
                adjDarkness = 0.5;
                reasons.push("too close to sunrise");
            }
            else {
                adjDarkness = 0.5;
                reasons.push("too soon after sunset");
            }
        }
    }



    let adjCloudCover = 1;
    if (cloud_cover>=80){
        reasons.push("high cloud coverage")
        adjCloudCover = 0;
    }
    else {
        if (cloud_cover>3){ //less than 3% I consider negligible
            reasons.push("medium cloud coverage")
        }
        adjCloudCover = 1-cloud_cover*1.25/100 //linear function mapping 80-0 cloud cover to 0-100 score adjustment
    }

    let adjTemp = 1;//default is pleasant temperature, so no score adjustment factor

    if (temperature<50){
        reasons.push("cold temperature")
        const difference = 50-temperature;
        adjTemp = 1- Math.pow(0.02*difference, 2) //quadtratic mapping of temperature to score adjustment when too cold  
        adjTemp = Math.max(adjTemp, 0); //make sure in case of extreme temperatures adjTemp does not go negative    
    }
    else if (temperature>80){
        reasons.push("hot temperature")
        const difference = temperature-80;
        adjTemp = 1-Math.pow(0.04*difference, 2) //quadtratic mapping of temperature to score adjustment when too hot
        adjTemp = Math.max(adjTemp, 0);
    }
    

    let adjTransparency = 1;

    if (transparency_est<0.5){//estimate of transparency based on weather
        reasons.push("subpar transparency")
        adjTransparency = transparency_est+0.5;//if transparency is lower than optimal (0.5-1), set adjustment factor equal to it+0.5
    }

    let adjWind = 1;

    if (wind_speed>20){
        reasons.push("high winds")
        adjWind = 1- 0.05*(wind_speed-20);// 0 if wind_speed>40, 1 is wind_Speed<=20, linear in between.
        adjWind = Math.max(0, adjWind);
    }

    const score = 100*adjCloudCover*adjTemp*adjTransparency*adjWind*adjDarkness;//90-100 for optimal stargazing, 50-90 for good conditions, 
    // 20-50 for subpar conditions, 0-20 for poor conditions
    const reason_string = reasons.join(", ");
    let score_desc;
    if (score<20){
        score_desc = "Poor"
    }
    else if (score<50){
        score_desc = "Subpar"
    }
    else if (score<90){
        score_desc = "Good (but not optimal)"
    }
    else {
        score_desc = "Optimal"
    }

    return [score, score_desc, reason_string];

}

async function loadWeather() {
    const response = await fetch(`/api/weather?lat=${state.lat}&lon=${state.lon}`); // fetch weather +data from api
    const data = await response.json();
    //console.log(data);

    if (!response.ok) {
        throw new Error(data.error || "error");
    }


    const current = data.current;// the values needed for this project
    const hourly = data.hourly;
    //const daily = data.daily;

    //console.log("FULL DATA:", data);
    //console.log("daily is:", data.daily);

    //const units = data.current_units;

    let fahrenheit_2m = current.temperature_2m*9/5+32; //convert temp to fahrenheit
    let  wind_mph = current.wind_speed_10m * 0.621371; //convert wind speed to mph

    //formula for transparency estimate from Beer-Lambert's law
    let  transparency_est = Math.exp(-3 * Math.pow(current.relative_humidity_2m/100, 4)) 
    

    //Computation of Gazing Score:
    //add reasons for all values below 1 (due to...)

    const current_time = new Date();
    const times = [];
    const gazing_scores = [];
    const score_descs = [];
    const reason_strings = [];
    const temps = [];
    const winds = [];
    const transparencies = [];
    const cloud_covers = [];

    // Compute gazing score at this instant
    const [gazing_score, score_desc, reason_string] = calculateScore(current.cloud_cover, fahrenheit_2m, transparency_est, wind_mph, current_time);
    
    const score_object = document.querySelector("#score");
    const score_header = document.querySelector("#scoreHeader");

    score_header.innerHTML = `<h2>Current GazingScore: ${gazing_score.toFixed(1)}/100</h2>`;

    if (reason_string === null){
        score_object.innerHTML = `<div>${score_desc} conditions.</div>`;
    }
    else {
        score_object.innerHTML = `<div>${score_desc} conditions due to ${reason_string}.</div>`;
    }    
     
    //push data to arrays for later display
    times.push(new Date(current_time));
    gazing_scores.push(gazing_score);
    score_descs.push(score_desc);
    reason_strings.push(reason_string);
    temps.push(fahrenheit_2m);
    winds.push(wind_mph);
    transparencies.push(transparency_est);
    cloud_covers.push(current.cloud_cover);

    //calculate gazing score for next 11 hours
    for (let i = 1; i<12; i++){
        let current_hour = current_time.getHours()+1;
        current_time.setHours(current_hour);
        current_time.setMinutes(0);
        current_time.setSeconds(0);
        current_time.setUTCMilliseconds(0);
        fahrenheit_2m = hourly.temperature_2m[current_hour]*9/5+32; //convert temp to fahrenheit
        wind_mph = hourly.wind_speed_10m[current_hour] * 0.621371; //convert wind speed to mph
        transparency_est = Math.exp(-3 * Math.pow(hourly.relative_humidity_2m[current_hour]/100, 4)) //formula for transparency estimate

        const [gazing_score1, score_desc1, reason_string1] = calculateScore(hourly.cloud_cover[current_hour], fahrenheit_2m, transparency_est, wind_mph, new Date(current_time));
        
        //push data to arrays
        times.push(new Date(current_time));
        gazing_scores.push(gazing_score1);
        score_descs.push(score_desc1);
        reason_strings.push(reason_string1);
        temps.push(fahrenheit_2m);
        winds.push(wind_mph);
        transparencies.push(transparency_est);
        cloud_covers.push(hourly.cloud_cover[current_hour]);
    }

    //insert data into html table
    const table = document.getElementById('scoreTable');
    for (let i = 0; i<12; i++){
        const row = table.insertRow();
        row.insertCell().textContent = times[i].toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        row.insertCell().textContent = gazing_scores[i].toFixed(1) + "/100, " + score_descs[i];
        row.insertCell().textContent = reason_strings[i];
        row.insertCell().textContent = temps[i].toFixed(1);
        row.insertCell().textContent = cloud_covers[i].toFixed(1);
        row.insertCell().textContent = (100*transparencies[i]).toFixed(1);
        row.insertCell().textContent = winds[i].toFixed(1);
    }

}


function needLocation(){//functions that need location, so will not run until location is turned on.
    loadWeather();
    const skyMap = new Skymap(state.lat, state.lon);
    const objs = brightestSpaceObjects(state);
    //const zenith = getSiderealTime();
    //this.sky.panTo(zenith, state.lat, 100);
    skyMap.setCenteredObj(objs[0]);
    const n = 10;
    renderBrightestList(objs.slice(0, n), skyMap);
}

//create moon graphic
const moon = new Moon();
moon.setMoonNow();
moon.drawMoon(document.getElementById("moonCanvas"), document.getElementById("moonText"))


/*const skyObj = {
    ra: 112.9541667,
    dec: 22.0036111,
    name: "Jupiter"
}*/
