
const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const statusText = document.getElementById("status");
const weatherCard = document.getElementById("weather-card");

const cityName = document.getElementById("city-name");
const localTime = document.getElementById("local-time");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const weatherIcon = document.getElementById("weather-icon");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const feelsLike = document.getElementById("feels-like");

// Convert weather codes into readable descriptions and icons.
function getWeatherDescription(code) {
    const weatherTypes = {
        0: ["Clear sky", "☀️"],
        1: ["Mainly clear", "🌤️"],
        2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Depositing rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"],
        53: ["Moderate drizzle", "🌦️"],
        55: ["Dense drizzle", "🌧️"],
        56: ["Light freezing drizzle", "🌧️"],
        57: ["Dense freezing drizzle", "🌧️"],
        61: ["Slight rain", "🌧️"],
        63: ["Moderate rain", "🌧️"],
        65: ["Heavy rain", "🌧️"],
        66: ["Light freezing rain", "🌧️"],
        67: ["Heavy freezing rain", "🌧️"],
        71: ["Slight snowfall", "🌨️"],
        73: ["Moderate snowfall", "🌨️"],
        75: ["Heavy snowfall", "❄️"],
        77: ["Snow grains", "❄️"],
        80: ["Slight rain showers", "🌦️"],
        81: ["Moderate rain showers", "🌧️"],
        82: ["Violent rain showers", "⛈️"],
        85: ["Slight snow showers", "🌨️"],
        86: ["Heavy snow showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with hail", "⛈️"],
        99: ["Thunderstorm with heavy hail", "⛈️"]
    };

    return weatherTypes[code] || ["Unknown conditions", "🌡️"];
}

// Fetch JSON and report HTTP errors explicitly.
async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Request failed (HTTP ${response.status}).`);
    }

    return response.json();
}

// Search for a city and retrieve its weather.
async function getWeather(city) {
    const locationURL =
        "https://geocoding-api.open-meteo.com/v1/search" +
        `?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const locationData = await fetchJSON(locationURL);

    if (!locationData.results || locationData.results.length === 0) {
        throw new Error("City not found. Please check the spelling.");
    }

    const location = locationData.results[0];

    const weatherURL =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${location.latitude}` +
        `&longitude=${location.longitude}` +
        "&current=temperature_2m,relative_humidity_2m," +
        "apparent_temperature,is_day,weather_code,wind_speed_10m" +
        "&timezone=auto";

    const weatherData = await fetchJSON(weatherURL);

    if (!weatherData.current) {
        throw new Error("Current weather data is unavailable.");
    }

    return { location, weather: weatherData };
}

// Update the interface using the returned JSON data.
function displayWeather(location, data) {
    const current = data.current;
    const [description, icon] =
        getWeatherDescription(current.weather_code);

    cityName.textContent = [location.name, location.admin1,
        location.country]
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index)
        .join(", ");

    temperature.textContent =
        Math.round(current.temperature_2m);

    humidity.textContent =
        `${current.relative_humidity_2m}%`;

    windSpeed.textContent =
        `${current.wind_speed_10m} km/h`;

    feelsLike.textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    condition.textContent = description;
    weatherIcon.textContent = icon;

    // Show the API's local time for the selected location.
    localTime.textContent =
        `Local time: ${current.time.replace("T", " ")}`;

    weatherCard.hidden = false;
}

// Handle the form submission.
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        statusText.textContent = "Please enter a city name.";
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    statusText.textContent = "Fetching weather data...";
    weatherCard.hidden = true;

    try {
        const result = await getWeather(city);

        displayWeather(result.location, result.weather);
        statusText.textContent = "Weather updated successfully.";
    } catch (error) {
        console.error("Weather error:", error);

        statusText.textContent =
            error instanceof TypeError
                ? "Network error. Check your internet connection and try again."
                : error.message || "Something went wrong. Please try again.";
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
});

// Load an initial city when the application opens.
getWeather("New Delhi")
    .then(({ location, weather }) => {
        displayWeather(location, weather);
        statusText.textContent = "Showing current weather for New Delhi.";
    })
    .catch((error) => {
        console.error("Initial weather error:", error);
        statusText.textContent =
            "Enter a city above to load its weather.";
    });
