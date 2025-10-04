# QuranMap

Web application displaying Quranic verses with geographical and historical context on interactive maps.

## Features

- Display Quranic verses in Arabic with English translations
- Dual map markers showing topic location and revelation location
- Color-coded markers (blue for topic location, green for revelation)
- Vanilla JavaScript with no framework dependencies

## Technology Stack

- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript
- Leaflet.js for maps
- Al-Quran Cloud API for Quranic text
- OpenStreetMap tiles

## File Structure

```
QuranMap/
├── index.html              # Main HTML file
├── app.js                  # Application logic
├── data.csv                # Verse metadata with coordinates
├── README.md               # This file
└── QURANMAP_TASKS.md       # Implementation plan and tasks
```

## Getting Started

### Prerequisites

- Modern web browser
- Local web server

### Running

1. Start a local web server in the project directory:
   ```bash
   python -m http.server 8000
   ```

2. Navigate to `http://localhost:8000`

## Usage

1. Select a verse from the dropdown menu
2. View Arabic text and English translation on the left
3. View map markers on the right:
   - Blue marker: Topic location (where event occurred)
   - Green marker: Revelation location (Mecca or Madinah)
4. Click markers for location details

## Data Structure

The `data.csv` file contains:

- `surah_number` - Surah number
- `ayah_number` - Ayah number
- `topic_location` - Geographical location name
- `topic_lat` - Latitude
- `topic_lon` - Longitude
- `description` - Brief context

Revelation location (Mecca/Madinah) is retrieved from the API.

## Code Architecture

### Core Functions

#### Data Management
- `parseCSV(text)` - Parses CSV data into JavaScript objects
- `fetchAyahData(surahNum, ayahNum)` - Fetches verse text, translation, and revelation type from API

#### Map Control
- `initMap()` - Initializes the Leaflet map
- `createMarkerIcons()` - Creates custom colored marker icons (blue for topic, green for revelation)
- `updateMapWithBothLocations(verseData, revelationType)` - Updates map with both topic and revelation markers

#### UI Management
- `populateDropdown(data)` - Fills dropdown with verse options
- `displayAyah(verseData)` - Displays selected verse and updates UI
- `showElement(id)` / `hideElement(id)` - UI helper functions

#### Event Handlers
- `handleVerseSelection(event)` - Handles dropdown selection changes
- `init()` - Initializes the application on page load

## API

Uses [Al-Quran Cloud API](https://alquran.cloud/api):

- Endpoint: `/v1/ayah/{surah}:{ayah}/editions/ar.alafasy,en.sahih`
- Arabic edition: `ar.alafasy`
- English translation: `en.sahih` (Saheeh International)
- Provides revelation type (Meccan/Medinan) for each verse
- Example: `https://api.alquran.cloud/v1/ayah/30:2/editions/ar.alafasy,en.sahih`

## Adding Verses

Add a line to `data.csv`:
```
surah_number,ayah_number,topic_location,topic_lat,topic_lon,description
```

Example:
```
2,125,Kaaba - Mecca,21.4225,39.8262,The Station of Abraham at the Kaaba
```

## Production Build

For production, replace Tailwind CDN with npm build:

```bash
npm install -D tailwindcss
npx tailwindcss init
npx tailwindcss -i ./input.css -o ./output.css --minify
```

Update `index.html` to use `output.css` instead of CDN link.

## License

Open source for educational purposes.