//file for handling state/lat/lon
export const state = { lat: 0, lon: 0 };

export function setState(lat, lon) {
  state.lat = lat;
  state.lon = lon;

  
  //use session storage so state doesn't reset while navigating
  sessionStorage.setItem("starboard_location", JSON.stringify({ lat, lon }));
}

export function loadState() {
  const saved = sessionStorage.getItem("starboard_location");
  if (!saved) return false;

  const { lat, lon } = JSON.parse(saved);
  state.lat = lat;
  state.lon = lon;
  return true;
}

export function hasLocation() {
  return sessionStorage.getItem("starboard_location") !== null;
}
