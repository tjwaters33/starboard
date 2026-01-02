import {getSiderealTime} from "./spaceobjects.js"

export class Skymap{
    constructor(lat, lon){
        this.lat = lat;
        this.lon = lon;
        this.sky = this.initSkyMap();
        this.centeredObj = {//object to center to on button push, with coordinates
            ra: 0,
            dec: 0
        };
    }

    setCenteredObj(obj){
        this.centeredObj = obj;
    }

    initSkyMap() {

        var sky;

        sky = S.virtualsky({//initialize sky map with VirtualSky
            id: 'starmap',	
            projection: "gnomic",
            latitude: this.lat,
            longitude: this.lon,
            clock: new Date(),
            ra: getSiderealTime() * 15,
            dec: this.lat,
            live: true,
            fov: 200, //maximum
            showcompass: true,
            showplanets: true,
            showplanetlabels: false,
            constellations: false,
            ground: true,
        });


        //when button is pressed, call focusObject()
        S('button#moveToObject').on('click', () => this.focusObject()); // => because otherwise this points to button
        return sky;
    }

    focusObject() {//focus on an object and circle/label it

        const obj = this.centeredObj;
        console.log(obj);
        const raDeg = obj.ra*15;
        this.sky.panTo(raDeg, obj.dec, 3000); // 3k ms
        const ring = document.getElementById("targetRing");
        const label = document.getElementById("targetLabel");

        ring.classList.remove("hidden");
        label.classList.remove("hidden");
        label.textContent = obj.name;
        return;
    }

}