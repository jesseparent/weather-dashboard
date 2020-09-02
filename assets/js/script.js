// Get Weather from Open Weather API
let fetchWeather = function () {
  // Get today's weather and UV Index in imperial units
  fetch("http://api.openweathermap.org/data/2.5/weather?q=Salt%20Lake%20City&appid=be266188bc75165d28d8ae37e120afe8&units=imperial")
    .then(function (weatherResponse) {
      return weatherResponse.json();
    })
    .then(function (weatherObj) {
      displayWeather(weatherObj);
      return fetch("http://api.openweathermap.org/data/2.5/uvi?appid=be266188bc75165d28d8ae37e120afe8&lat=" + weatherObj.coord.lat + "&lon=" + weatherObj.coord.lon)
    })
    .then(function (uviResonse) {
      return uviResonse.json();
    })
    .then(function (uviObj) {
      displayUVI(uviObj)
    });

  // Get 5-day forecast in imperial units
  fetch("http://api.openweathermap.org/data/2.5/forecast?q=Salt%20Lake%20City&appid=be266188bc75165d28d8ae37e120afe8&units=imperial")
    .then(function (forecastResponse) {
      return forecastResponse.json();
    })
    .then(function (forecastObj) {
      displayFiveDay(forecastObj);
    });
};

// Display weather for today
let displayWeather = function (dataObj) {
  let cityName = dataObj.name;
  let todaysDate = moment(parseInt(dataObj.dt) * 1000).format("M/DD/YYYY");
  console.log(cityName + " (" + todaysDate + ")");
  let weatherIcon = dataObj.weather[0].icon;
  console.log("http://openweathermap.org/img/wn/" + weatherIcon + "@2x.png");

  let temperature = dataObj.main.temp;
  console.log("Temperature: " + temperature + " °F");
  let humidity = dataObj.main.humidity;
  console.log("Humidity: " + humidity + "%");
  let windSpeed = dataObj.wind.speed;
  console.log("Wind Speed: " + windSpeed + " MPH");
};

// Display UV Index for today
let displayUVI = function (uviObj) {
  let uvIndex = uviObj.value;
  let condition = (uvIndex < 6)? ((uvIndex < 3)? "favorable" : "moderate") : "severe";
  console.log("UV Index: " + uvIndex + " - " + condition);
};

// Display 5 Day forecast
let displayFiveDay = function (forecastObj) {
  let days = forecastObj.list;

  console.log("----------");
  for (let i = 0; i < days.length; i++) {
    let theDate = moment(days[i].dt_txt).format("M/DD/YYYY H");
    console.log(theDate);
    let weatherIcon = days[i].weather[0].icon;
    console.log("http://openweathermap.org/img/wn/" + weatherIcon + "@2x.png");
    let temperature = days[i].main.temp;
    console.log("Temperature: " + temperature + " °F");
    let humidity = days[i].main.humidity;
    console.log("Humidity: " + humidity + "%");
    console.log("----------");
  }
};

fetchWeather();