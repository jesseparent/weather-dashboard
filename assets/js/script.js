// Store Open Weather API key
let openWeatherKey = "d29753543671bbb32ab67b6cd97cac2e";
let zipCodeKey = "SPv93RVeQxyvRKJ8XkKJtA2i8RlDKDnTgCNyPczfOET3cfp6jWdypgOlACRDEBLG";

// Store good HTML for each results panel in case an erorr gets displayed and we need to recover this
let todayGoodResult = $(".today").html();
let fiveDayGoodResult = $("#fiveDayCards").html();

// Find the history list element
let historyList = $(".list-group");

// History of cities that have been searched
let historyLinks = JSON.parse(localStorage.getItem('history')) // Check local storage for values
  // If there is nothing in local storage, create an empty list
  || [];

// Keep track of what the last search was
let searchedCity = "";

// Fetch the weather of the city  
let fetchWeather = function (city) {
  // Show Results panel
  setupResults();

  // Keep track of what the last search was
  searchedCity = city;

  // Get today's weather and UV Index in imperial units
  fetch("https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + openWeatherKey + "&units=imperial")
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
      displayUVI(oneCallObj); // Display UV Index
      displayFiveDay(oneCallObj); // Display Five Day Forecast
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

// Open Weather cannot take just "City, State" so find a Zip Code to use
let fetchZipCodeThenWeather = function (cityState) {
  setupResults();

  let cityStateArr = cityState.split(", ");

  fetch("https://cors-anywhere.herokuapp.com/https://www.zipcodeapi.com/rest/" + zipCodeKey + "/city-zips.json/" + cityStateArr[0] + "/" + cityStateArr[1])
    .then(function (zipCodeResponse) {
      if (zipCodeResponse.ok) {
        return zipCodeResponse.json();
      }
      else {
        throw "Error";
      }
    })
    .then(function (zipCodeObj) {
      // Got the Zip Code so let's give it to the fetchWeather function
      let cityStateZip = cityState + " " + zipCodeObj.zip_codes[0];
      fetchWeather(cityStateZip);
    })
    .catch(function (error) {
      // Zip code lookup failed, let the main fatechWeather function handle the error
      fetchWeather(cityState);
    });
};

// Display weather and date for today
let displayWeather = function (dataObj) {
  // City and date details
  let cityName = dataObj.name;
  let todaysDate = moment(parseInt(dataObj.dt) * 1000).format("M/DD/YYYY");
  let weatherIcon = dataObj.weather[0].icon;

  // City, date, and weather icon
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

  // This was a successful search - save it
  saveToHistory(cityName);
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

// Load history and display it
let loadHistory = function () {
  historyList.html("");

  if (historyLinks.length > 0) {
    $("#deleteHistory").removeClass("d-none");
  }
  else {
    $("#deleteHistory").addClass("d-none");
  }

  for (let i = 0; i < historyLinks.length; i++) {
    liItem = '<li class="list-group-item d-flex justify-content-between align-items-center" data-search-string="' + historyLinks[i].searchString +
      '"><span id="displayText">' + historyLinks[i].display + '</span><button class="btn btn-danger p-1" title="Delete ' + historyLinks[i].display + '"><b>X</b></button></li>';
    historyList.append(liItem);
  }

  // Set up listeners for history items
  $(".btn-danger").click(function (event) {
    event.stopPropagation();
    deleteItem($(this).closest("li").children("#displayText").text());
  });

  $(".list-group-item").click(function () {
    fetchWeather($(this).attr("data-search-string"));
  });
};

// Save to history of searches to local storage
let saveToHistory = function (city) {
  let historyObj = { "display": city, "searchString": searchedCity };

  // Don't save duplicates
  if (historyObjIsUnique(historyObj, historyLinks)) {
    historyLinks.push(historyObj);

    localStorage.setItem('history', JSON.stringify(historyLinks));

    loadHistory();
  }
};

// Test that history object is not in history
let historyObjIsUnique = function (obj, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (obj.display === arr[i].display) {
      return false;
    }
  }
  return true;
};

// Delete item from history
let deleteItem = function (city) {
  for (let i = 0; i < historyLinks.length; i++) {
    if (city === historyLinks[i].display) {
      historyLinks.splice(i, 1);
      break;
    }
  }

  localStorage.setItem('history', JSON.stringify(historyLinks));

  loadHistory();
};

let cityStateFormat = function (searchString) {
  let commaArr = searchString.split(", ");
  if (commaArr.length <= 1) {
    // No comma, so this is just a City
    return false;
  }

  let spaceArr = commaArr[1].split(" ");
  if (spaceArr.length <= 1) {
    // No space, so this is just a State with no zip
    return true;
  }
  else {
    // Space exists so assuming a zip code
    return false;
  }

};

// Search button clicked
$("#citySearchBtn").click(function () {

  // Get city to find the weather for
  let city = $(this).siblings("#cityInput").val();

  // Is this in "City, State" format? If so, need the zip code, first
  if (cityStateFormat(city)) {
    fetchZipCodeThenWeather(city);
  }
  else {
    // Query the city's weather
    fetchWeather(city);
  }

  // Clear the input value
  $("#cityInput").val("");
});

// Enter is pressed while in text input
$("#cityInput").keyup(function (event) {
  if (event.which == 13) {
    // Simulate a button click
    $("#citySearchBtn").click();
  }
});

// Remove history
$("#deleteHistoryBtn").click(function () {
  historyLinks = [];

  localStorage.setItem('history', JSON.stringify(historyLinks));

  loadHistory();
});

// Load the history of previous searches
loadHistory();