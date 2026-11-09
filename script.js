// UK Tick Tracker

// API endpoint
const API_URL = "https://dev-task.elancoapps.com/data/tick-sightings";

// These are the map positions of each city from the API
const cityPositions = {
  Aberdeen: [57.1497, -2.0943],
  Belfast: [54.5973, -5.9301],
  Birmingham: [52.4862, -1.8904],
  Bournemouth: [50.7192, -1.8808],
  Brighton: [50.8225, -0.1372],
  Bristol: [51.4545, -2.5879],
  Cambridge: [52.2053, 0.1218],
  Cardiff: [51.4816, -3.1791],
  Edinburgh: [55.9533, -3.1883],
  Exeter: [50.7184, -3.5339],
  Glasgow: [55.8642, -4.2518],
  Leeds: [53.8008, -1.5491],
  Leicester: [52.6369, -1.1398],
  Liverpool: [53.4084, -2.9916],
  London: [51.5074, -0.1278],
  Manchester: [53.4808, -2.2426],
  Newcastle: [54.9783, -1.6178],
  Norwich: [52.6309, 1.2974],
  Nottingham: [52.9548, -1.1581],
  Oxford: [51.752, -1.2577],
  Plymouth: [50.3755, -4.1427],
  Sheffield: [53.3811, -1.4701],
  Southampton: [50.9097, -1.4044],
  York: [53.96, -1.0873]
};

let sightings = [];
let map;
let markers; // layer that holds all the markers

// Set up the map, centred on the UK
map = L.map("map").setView([54.5, -3], 6);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "OpenStreetMap contributors"
}).addTo(map);
markers = L.layerGroup().addTo(map);

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB");
}

// Turn the API records into the shape the app uses
function convertSightings(rawList) {
  const result = [];

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i];

    // location might be a city name, or an object that contains one
    let city = raw.location;
    let lat;
    let lng;
    if (typeof city === "object") {
      lat = city.lat || city.latitude;
      lng = city.lng || city.longitude;
      city = city.city || city.name;
    }

    // if there is no position in the data, look the city up
    if (!lat) {
      const position = cityPositions[city];
      if (!position) {
        continue; // cannot put this one on the map
      }
      lat = position[0];
      lng = position[1];
    }

    result.push({
      id: raw.id,
      city: city,
      // small random shift so sightings in one city do not sit on top of each other
      lat: Number(lat) + (Math.random() - 0.5) * 0.1,
      lng: Number(lng) + (Math.random() - 0.5) * 0.1,
      species: raw.latinName,
      commonName: raw.species,
      date: raw.date
    });
  }
  return result;
}

// The API has no severity, so work it out from how many sightings each city has.
// The busiest city is "high", the quietest are "low".
function addSeverity(list) {
  const counts = {};
  for (let i = 0; i < list.length; i++) {
    const city = list[i].city;
    counts[city] = (counts[city] || 0) + 1;
  }

  let max = 0;
  for (const city in counts) {
    if (counts[city] > max) {
      max = counts[city];
    }
  }

  for (let i = 0; i < list.length; i++) {
    const share = counts[list[i].city] / max;
    if (share > 0.66) {
      list[i].severity = "high";
    } else if (share > 0.33) {
      list[i].severity = "medium";
    } else {
      list[i].severity = "low";
    }
  }
}

// Add each species found in the data to the species filter
function fillSpeciesFilter() {
  const select = document.getElementById("species-filter");
  const added = [];

  for (let i = 0; i < sightings.length; i++) {
    const species = sightings[i].species;
    if (added.indexOf(species) === -1) {
      added.push(species);
      const option = document.createElement("option");
      option.textContent = species;
      select.appendChild(option);
    }
  }
}

// Fill the city dropdown in the report form
function fillCityDropdown() {
  const select = document.getElementById("r-city");
  for (const city in cityPositions) {
    const option = document.createElement("option");
    option.textContent = city;
    select.appendChild(option);
  }
}

// Get the sightings from the API, or use the sample ones
async function loadData() {
  let rawList;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    rawList = data.data || data; // the list might be inside an object
    if (!(rawList.length > 0)) {
      throw new Error("No data from API");
    }
  } catch (error) {
    console.log("API failed, using sample data", error);
    rawList = sampleSightings;
    document.getElementById("banner").classList.remove("hidden");
  }

  sightings = convertSightings(rawList);
  addSeverity(sightings);

  // add the sightings the user reported earlier
  const saved = localStorage.getItem("reports");
  if (saved) {
    sightings = sightings.concat(JSON.parse(saved));
  }

  fillSpeciesFilter();
  showSightings();
}

// Pick the marker colour from the severity
function getColour(severity) {
  if (severity === "high") {
    return "red";
  } else if (severity === "medium") {
    return "orange";
  } else {
    return "green";
  }
}

// Show the sightings that match the filters on the map and in the list
function showSightings() {
  const species = document.getElementById("species-filter").value;
  const severity = document.getElementById("severity-filter").value;
  const list = document.getElementById("list");

  markers.clearLayers();
  list.innerHTML = "";
  let count = 0;

  for (let i = 0; i < sightings.length; i++) {
    const s = sightings[i];

    // skip sightings that do not match the filters
    if (species !== "all" && s.species !== species) {
      continue;
    }
    if (severity !== "all" && s.severity !== severity) {
      continue;
    }
    count++;

    // marker on the map
    const marker = L.circleMarker([s.lat, s.lng], {
      color: getColour(s.severity),
      fillColor: getColour(s.severity),
      fillOpacity: 0.8,
      radius: 8
    });
    marker.on("click", function () {
      showDetails(s);
    });
    marker.addTo(markers);

    // item in the results list
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = s.city + " - " + s.species + " - " + formatDate(s.date) + " - " + s.severity;
    button.addEventListener("click", function () {
      showDetails(s);
    });
    item.appendChild(button);
    list.appendChild(item);
  }

  document.getElementById("count").textContent = "(" + count + ")";
}

// Fill in the details panel for one sighting
function showDetails(s) {
  document.getElementById("d-city").textContent = s.city;
  document.getElementById("d-species").textContent = s.species;
  document.getElementById("d-common").textContent = s.commonName || "Not given";
  document.getElementById("d-date").textContent = formatDate(s.date);
  document.getElementById("d-severity").textContent = s.severity;
  document.getElementById("d-directions").href =
    "https://www.google.com/maps/dir/?api=1&destination=" + s.lat + "," + s.lng;
  document.getElementById("details").classList.remove("hidden");
  map.setView([s.lat, s.lng], 9);
}

document.getElementById("species-filter").addEventListener("change", showSightings);
document.getElementById("severity-filter").addEventListener("change", showSightings);

// Report form
document.getElementById("report-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const messages = document.getElementById("messages");
  messages.innerHTML = "";

  const date = document.getElementById("r-date").value;
  const time = document.getElementById("r-time").value;
  const city = document.getElementById("r-city").value;
  const species = document.getElementById("r-species").value;
  const severity = document.getElementById("r-severity").value;

  // check that everything has been filled in
  if (date === "" || time === "" || city === "" || species === "" || severity === "") {
    messages.innerHTML = '<p class="error">Please fill in every field.</p>';
    return;
  }

  // save the new sighting
  const position = cityPositions[city];
  const newSighting = {
    id: "local-" + Date.now(),
    city: city,
    lat: position[0],
    lng: position[1],
    species: species,
    commonName: "",
    severity: severity,
    date: date
  };
  sightings.push(newSighting);

  const saved = JSON.parse(localStorage.getItem("reports")) || [];
  saved.push(newSighting);
  localStorage.setItem("reports", JSON.stringify(saved));

  showSightings();
  messages.innerHTML = '<p class="success">Thanks! Your sighting has been added.</p>';
  document.getElementById("report-form").reset();
});

fillCityDropdown();
loadData();
