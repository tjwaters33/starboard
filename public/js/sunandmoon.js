//import SunCalc from 'suncalc';
import SunCalc from "https://cdn.jsdelivr.net/npm/suncalc@1.9.0/+esm";
//classes for sun and moon and relevant methods


export class Moon {
    constructor(phaseNumber = 0, illumination = null, angle = null){
        this.phaseNumber = phaseNumber;//phase number
        this.phase = this.getPhase(phaseNumber);//phase string
        this.illumination = illumination;//percent of moon illuminated
        this.angle = angle;//angle of shadow
    }

    getPhase(phaseNumber){
        if (phaseNumber <0.06125) return "New Moon";
        else if (phaseNumber < 0.1875) return "Waxing Crescent";
        else if (phaseNumber < 0.3125) return "First Quarter";
        else if (phaseNumber < 0.4375) return "Waxing Gibbous";
        else if (phaseNumber < 0.5625) return "Full Moon";
        else if (phaseNumber < 0.6875) return "Waning Gibbous";
        else if (phaseNumber < 0.8125) return "Last Quarter";
        else if (phaseNumber < 0.9375) return "Waning Crescent";
        else return "New Moon";
    }

    setMoonNow(){//set attributes of moon
        const date = new Date();
        const mi = SunCalc.getMoonIllumination(date);
        this.phaseNumber = mi.phase;
        this.phase = this.getPhase(mi.phase);
        this.illumination = mi.fraction;
        this.angle = mi.angle;
        //console.log(this.angle);
    }
    drawMoon(canvas, text) {//draw moon in html using canvas

        //get context, find width, height, centers, and radius, then clears frame
        const ctx = canvas.getContext("2d");
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const r = Math.min(w, h) * 0.42;
        ctx.clearRect(0, 0, w, h);

        //set the origin as the center, then rotate by moon angle
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.angle-Math.PI/2);

        // draw dark background disk
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = "darkslategray";
        ctx.fill();

        ctx.save();

        // main moon circle, use clip so nothing draws outside circle
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();

        // compute which side is illuminated and how much to shift based on illumination (0-1)
        const waxing = this.phaseNumber < 0.5;
        const shift = (1 - this.illumination) * 2 * r;
        const lightX = waxing ? shift : -shift;

        ctx.beginPath();
        ctx.arc(lightX, 0, r, 0, Math.PI * 2);
        ctx.clip();//clip again to the secondary circle


        // Draw the lit region
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = "#f2f2f2";
        ctx.fill();

        ctx.restore();

        // Outline
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        text.innerHTML = `<div>Phase: ${this.phase}, ${(100*this.illumination).toFixed(1)}% illumination.</div>`;
    }


        
}

export class Sun {
    constructor(date = new Date(), latitude = 40.40, longitude = -76.65){
        self.dayTime = date;
        self.latitude = latitude;
        self.longitude = longitude;
    }

    getTimes(){//get times of sunset, sunrise, and night times
        const times = SunCalc.getTimes(self.dayTime, self.latitude, self.longitude)
        return [times.sunrise, times.sunset, times.nightEnd, times.night]
    }
}