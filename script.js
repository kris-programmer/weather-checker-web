// Convert Open-Meteo weather codes to words and icons
const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Depositing rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Moderate drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌦️" },
  56: { label: "Light freezing drizzle", icon: "🌧️" },
  57: { label: "Dense freezing drizzle", icon: "🌧️" },
  61: { label: "Slight rain", icon: "🌦️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Light freezing rain", icon: "🌧️" },
  67: { label: "Heavy freezing rain", icon: "🌧️" },
  71: { label: "Slight snow fall", icon: "🌨️" },
  73: { label: "Moderate snow fall", icon: "🌨️" },
  75: { label: "Heavy snow fall", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Slight rain showers", icon: "🌦️" },
  81: { label: "Moderate rain showers", icon: "🌧️" },
  82: { label: "Violent rain showers", icon: "🌧️" },
  85: { label: "Slight snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with slight hail", icon: "⛈️" },
  99: { label: "Thunderstorm with heavy hail", icon: "⛈️" }
};

function getConditionFromCode(code) {
  return WEATHER_CODES[code]?.label || "Unknown";
}

function getWeatherIconFromCode(code) {
  return WEATHER_CODES[code]?.icon || "❔";
}

// Get the city's coordinates (country, lat, lon)
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.results?.length > 0) {
    const place = data.results[0];
    return {
      name: place.name,
      country: place.country,
      country_code: place.country_code,
      lat: place.latitude,
      lon: place.longitude
    };
  } else {
    alert("No such city found.");
    return null;
  }
}

// Fetch weather data
async function fetchWeather(lat, lon, includeFuture = false) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,windspeed_10m,weathercode`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.hourly || !data.hourly.temperature_2m.length) {
    throw new Error("No weather data found");
  }

  const code = data.hourly.weathercode[0];

  // Get current weather data
  const result = {
    temp: data.hourly.temperature_2m[0],
    windspeed: data.hourly.windspeed_10m[0],
    rainChance: data.hourly.precipitation_probability[0],
    condition: getConditionFromCode(code),
    code
  };

  // Get today's weather data (24H)
  if (includeFuture) {
    result.future = data.hourly.time.slice(0, 24).map((time, i) => {
      const codeI = data.hourly.weathercode[i];
      return {
        time,
        temp: data.hourly.temperature_2m[i],
        windspeed: data.hourly.windspeed_10m[i],
        rainChance: data.hourly.precipitation_probability[i],
        condition: getConditionFromCode(codeI),
        conditionCode: codeI
      };
    });
  }

  return result;
}

// Populate page with a panel showing current weather data
function populatePage(cityName, countryName, countryCode, weather) {
  const section = document.getElementById("results");
  const flagImg = countryCode
    ? `<img src="https://flagcdn.com/32x24/${countryCode.toLowerCase()}.png" alt="${countryName} flag" style="vertical-align:middle; margin-right:10px; border-radius:4px; box-shadow:0 1px 4px #ccc;">`
    : "";

  section.innerHTML = `
    <h2>${flagImg}<span class="label-title">Location:</span> ${cityName}, ${countryName}</h2>
    <label><span class="label-title">Temperature:</span> ${weather.temp}°C</label>
    <br>
    <label><span class="label-title">Wind Speed:</span> ${weather.windspeed} km/h</label>
    <br>
    <label><span class="label-title">Rain Chance:</span> ${weather.rainChance}%</label>
    <br>
    <label><span class="label-title">Condition:</span> ${getWeatherIconFromCode(weather.code)} ${weather.condition}</label>
  `;

  // Add class for easier access
  section.classList.add("current-weather");
}

// Populate page with a panel showing the whole day's weather data
function populateFuturePanel(futureData) {
  const panel = document.getElementById("future-panel");
  if (!panel) return;

  let html = `<h3>Today's Forecast</h3>
  <table class="future-table">
    <tr>
      <th>Time</th>
      <th>Temp (°C)</th>
      <th>Wind (km/h)</th>
      <th>Rain (%)</th>
      <th>Condition</th>
    </tr>`;

  for (const hour of futureData) {
    const time = new Date(hour.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    html += `<tr>
      <td>${time}</td>
      <td>${hour.temp}°C</td>
      <td>${hour.windspeed} km/h</td>
      <td>${hour.rainChance}%</td>
      <td>${getWeatherIconFromCode(hour.conditionCode)} ${hour.condition}</td>
    </tr>`;
  }

  html += "</table>";
  panel.innerHTML = html;
}

// Handle user input and weather check button click
document.getElementById("weather-check-button").addEventListener("click", async () => {
  const cityName = document.getElementById('location-input').value;
  const city = await getCoordinates(cityName);
  if (!city) return;

  const weatherNow = await fetchWeather(city.lat, city.lon);
  const weather24h = await fetchWeather(city.lat, city.lon, true);

  populatePage(city.name, city.country, city.country_code, weatherNow);
  populateFuturePanel(weather24h.future);
});
