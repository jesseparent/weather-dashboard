// Store Open Weather API key
let openWeatherKey = "d29753543671bbb32ab67b6cd97cac2e";

let todayGoodResult = $(".today").html();
let fiveDayGoodResult = $("#fiveDayCards").html();

let fetchWeather = function (city) {
  // Get today's weather and UV Index in imperial units
  fetch("http://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + openWeatherKey + "&units=imperial")
    .then(function (weatherResponse) {
      if (weatherResponse.ok) {
        return weatherResponse.json();
      }
      else {
        // The API call for Open Weather's Current Weather API did not return as successful
        throw "Weather";
      }
    })
    .then(function (weatherObj) {
      displayWeather(weatherObj);
      return fetch("https://api.openweathermap.org/data/2.5/onecall?exclude=minutely,hourly&units=imperial&appid=" + openWeatherKey + "&lat=" + weatherObj.coord.lat + "&lon=" + weatherObj.coord.lon);
    })
    .then(function (oneCallResponse) {
      if (oneCallResponse.ok) {
        return oneCallResponse.json();
      }
      else {
        // The API call for Open Weather's One Call API did not return as successful
        throw "OneCall";
      }
    })
    .then(function (oneCallObj) {
      displayUVI(oneCallObj)
      displayFiveDay(oneCallObj);
    })
    .catch(function (error) {
      // Error thrown
      let today = $(".today");
      let fiveDay = $("#fiveDayCards");

      if (error === "Weather") {        
        today.html("<h2>Cannot Obtain Data for that Query</h2>");
        today.css("visibility", "visible");
      }
      else if (error === "OneCall") {        
        fiveDay.html("<h2>No 5 Day Forecast for that Query</h2>");
        fiveDay.css("visibility", "visible");
      }
      else {
        today.html("<h2>Failed to Reach API</h2>");
        today.css("visibility", "visible");
      }
    });
};

// Display weather and date for today
let displayWeather = function (dataObj) {
  // City and date details
  let cityName = dataObj.name;
  let todaysDate = moment(parseInt(dataObj.dt) * 1000).format("M/DD/YYYY");
  let weatherIcon = dataObj.weather[0].icon;

  $("#cityDate").html(cityName + ' (' + todaysDate + ')  <img class="wi" src="http://openweathermap.org/img/wn/' + weatherIcon + '@2x.png">');

  // Weather details for city
  let temperature = dataObj.main.temp;
  let humidity = dataObj.main.humidity;
  let windSpeed = dataObj.wind.speed;

  $("#temperature").text(temperature);
  $("#humidity").text(humidity);
  $("#windSpeed").text(windSpeed);

  // Show today's forecast
  $(".today").css("visibility", "visible");
};

// Display UV Index for today
let displayUVI = function (uviObj) {
  let uvIndex = uviObj.current.uvi;
  let uvIndexObj = $("#uvIndex");

  uvIndexObj.text(uvIndex);

  // Determine if UV Index is favorable (under 3.0), moderate (under 6.0), or severe (6.0 or more)
  //  as determined by the EPA at https://www.epa.gov/sunsafety/uv-index-scale-0
  let condition = (uvIndex < 6) ? ((uvIndex < 3) ? "bg-success" : "bg-warning") : "bg-danger";

  $("#uvIndex").removeClass("bg-success bg-warning bg-danger");
  uvIndexObj.addClass(condition);
};

// Display 5 Day forecast
let displayFiveDay = function (forecastObj) {
  let days = forecastObj.daily;

  // Just need days 1 - 5 from the 7 day forecast
  for (let i = 1; i <= 5; i++) {
    let currentCard = "#forecast" + i;

    let theDate = moment(parseInt(days[i].dt) * 1000).format("M/DD/YYYY");
    let weatherIcon = days[i].weather[0].icon;
    let temperature = days[i].temp.day;
    let humidity = days[i].humidity;

    $(currentCard).find(".card-title").text(theDate);
    $(currentCard).find(".wi").attr("src", "http://openweathermap.org/img/wn/" + weatherIcon + "@2x.png");
    $(currentCard).find(".temp").text(temperature);
    $(currentCard).find(".hum").text(humidity);

    // Show the 5 day forecast
    $(".fiveDay").css("visibility", "visible");
  }
};

// Hide today's and 5 day forecasts until there is data
// There may have been a bad API call before this so reset the HTML to expect a good result
let setupResults = function () {
  // Hide today's and 5 day forecasts
  $(".today").css("visibility", "hidden");
  $(".fiveDay").css("visibility", "hidden");

  // Set HTML for today's weather panel to anticipate a successful API call
  $(".today").html(todayGoodResult);
  $("#fiveDayCards").html(fiveDayGoodResult);
};

// Search button clicked
$("#citySearchBtn").click(function () {

  // Get city to find the weather for
  let city = $(this).siblings("#cityInput").val();

  // Query the city's weather
  fetchWeather(city);

  // Show Results panel
  setupResults();
});