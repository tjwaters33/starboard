import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// Weather endpoint
app.get("/api/weather", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {//validation
      return res.status(400).json({ error: "lat and lon are required numbers" });
    }

    // set search parameters to get desired info
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat);
    url.searchParams.set("longitude", lon);
    url.searchParams.set("timezone", "America/New_York");
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m"
    );
    url.searchParams.set(
      "hourly",
      "temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m"
    );
    url.searchParams.set(
      "daily",
      "sunrise,sunset"
    );
    url.searchParams.set("forecast_days", "2");

    // 3) Fetch data
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(502).json({ error: `Weather provider error: ${r.status}` });
    }
    const data = await r.json();

    // 5) Res to browser
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
