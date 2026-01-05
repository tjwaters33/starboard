//javascript logic for starfinder.html

import { Skymap } from "./skymap.js";
import { brightestSpaceObjects, renderBrightestList } from "./spaceobjects.js";
import { state, loadState } from "./state.js";

function runStarfinder() {//load sky map and list of brightest objects
  const skyMap = new Skymap(state.lat, state.lon);
  const objs = brightestSpaceObjects(state);

  if (objs && objs.length) {
    skyMap.setCenteredObj(objs[0]);
    if (objs[0].name == "The Sun: Solar System"){
      const directions = document.getElementById("directions");
      if (directions) directions.textContent = "Warning! The Sun is out. To view anything less bright than -0.5 \
      magnitude you need a powerful telescope. To view anything near the Sun, you need a solar telescope!";
    }
    renderBrightestList(objs.slice(0, 10), skyMap);
  }
}

// On page load, start
if (loadState()) {
  runStarfinder();
} else {
  const directions = document.getElementById("directions");
  if (directions) directions.textContent = "Enable location on StarBoard page first.";
}
