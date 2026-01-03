//javascript logic for starfinder.html

import { Skymap } from "./skymap.js";
import { brightestSpaceObjects, renderBrightestList } from "./spaceobjects.js";
import { state, loadState } from "./state.js";

function runStarfinder() {//load sky map and list of brightest objects
  const skyMap = new Skymap(state.lat, state.lon);
  const objs = brightestSpaceObjects(state);

  if (objs && objs.length) {
    skyMap.setCenteredObj(objs[0]);
    renderBrightestList(objs.slice(0, 10), skyMap);
  }
}

// On page load, start
if (loadState()) {
  runStarfinder();
} else {
  const directions = document.getElementById("directions");
  if (directions) directions.textContent = "Enable location on Home page first.";
}
