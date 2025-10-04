// Functions that contact Open-Meteo API for city geo data
async function getCoordinates(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
        const place = data.results[0];
        return {
            name: place.name,
            country: place.country,
            country_code: place.country_code,
            lat: place.latitude,
            lon: place.longitude
        };
    }
    else {
        window.alert("No such city found.");
    }
}

async function getWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,windspeed_10m,weathercode`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.hourly && data.hourly.temperature_2m.length > 0) {
        return {
            temp: data.hourly.temperature_2m[0],
            windspeed: data.hourly.windspeed_10m[0],
            rainChance: data.hourly.precipitation_probability[0],
            condition: getConditionFromCode(data.hourly.weathercode[0])
        };
    }
    else {
        throw new Error("No results found");
    }
}

// Open-Meteo returns numbers instead of words
function getConditionFromCode(code) {
    const conditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };
    return conditions[code] || "Unknown";
}

function populatePage(cityName, countryName, countryCode, cityTemp, cityWindSpeed, cityRainChance, cityCondition) {
    // Create a new section element
      const section = document.getElementById("results");
      // Get country flag
      const flagImg = countryCode
        ? `<img src="https://flagcdn.com/32x24/${countryCode.toLowerCase()}.png" alt="${countryName} flag" style="vertical-align:middle; margin-right:10px; border-radius:4px; box-shadow:0 1px 4px #ccc;">`
        : "";

      // Add a weather content "panel" to page
      section.innerHTML = `
        <h2>${flagImg}<span class="label-title">Location:</span> ${cityName}, ${countryName}</h2>
        <label><span class="label-title">Temperature:</span> ${cityTemp}°C</label>
        <br>
        <label><span class="label-title">Wind Speed:</span> ${cityWindSpeed} km/h</label>
        <br>
        <label><span class="label-title">Rain Chance:</span> ${cityRainChance}%</label>
        <br>
        <label><span class="label-title">Condition:</span> ${cityCondition}</label>`;

      // Adding a class to it for easy access
      section.classList.add("current-weather");
}

document.getElementById("weather-check-button").addEventListener("click", async () => {
    // Contact Opne-Meteo API and get the data
    const city = await getCoordinates(document.getElementById('location-input').value);
    const data = await getWeatherData(city.lat, city.lon);
    
    populatePage(city.name, city.country, city.country_code, data.temp, data.windspeed, data.rainChance, data.condition);
});