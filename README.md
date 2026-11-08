# UK Tick Tracker

**Author:** Mohamud Sharif
**Task:** Elanco Placement Programme - Frontend technical task

A simple web app that shows tick sightings on a map of the UK. You can filter sightings, click a sighting for details, read about ticks, and report your own sighting.

## How to run

1. Install VS Code and the **Live Server** extension.
2. Open this folder in VS Code.
3. Right click 'index.html' and choose **Open with Live Server**.

Live Server is used because browsers can block 'fetch' on files opened directly. An internet connection is needed for the map.

## What I built

Area and the requirements I did
1. Map: Dynamic map, markers coloured by severity (worked out from the data), species and severity filters
2. Sighting info: Details panel when a sighting is clicked, Report a sighting and Get directions buttons
3. Education: Species guide, prevention tips
4. Report: Report form, error and success messages

I did not build the timeline, seasonal chart, share button, image upload or wireframes. I kept this to the minimum so that I understand all of the code.

## Choices

- **HTML, CSS and JavaScript only:** no framework, so the code stays short and I can explain all of it.
- **Leaflet:** a free map library that needs no API key.
- **localStorage:** the task is frontend only, so reports are saved in the browser. A real version would use a database.
- **Sample data:** if the API can't be loaded, the app uses a few sample sightings so the map isn't empty.
- **The API data:** it comes from the '/tick-sightings' endpoint. Each record has 'id', 'date', 'location' (a city), 'species' (common name) and 'latinName'.
- **Severity:** the API has no severity field, so I worked it out from how many sightings each city has. The busiest city is "high" and the quietest are "low". This is my own choice, and a real system would need a proper definition of severity.
- **City positions:** the API gives a city name and not coordinates, so I added a list of UK city positions in `script.js`. Sightings in the same city are shifted slightly so they don't sit on top of each other.
- **Rate limit:** the API limits how often it can be called so the app only requests the data once when the page loads.

## Files

- 'index.html': page structure and content
- 'style.css': styling
- 'script.js': map, filters, details panel and form
