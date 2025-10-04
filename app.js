/**
 * QuranMap Application
 * A simple application to display Quranic verses with geographical context
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Revelation location coordinates
 * These are the historical locations where verses were revealed
 */
const REVELATION_LOCATIONS = {
    Meccan: {
        name: 'Mecca',
        lat: 21.4225,
        lon: 39.8262
    },
    Medinan: {
        name: 'Madinah',
        lat: 24.5247,
        lon: 39.5692
    }
};

/**
 * API configuration for Al-Quran Cloud API
 * This API is CORS-enabled and works perfectly with client-side JavaScript
 * Edition en.sahih is Saheeh International English translation
 */
const API_BASE_URL = 'https://api.alquran.cloud/v1';
const TRANSLATION_EDITION = 'en.sahih'; // Saheeh International English translation

// ============================================================================
// GLOBAL STATE
// ============================================================================

let map = null; // Leaflet map instance
let topicMarker = null; // Marker for topic location
let revelationMarker = null; // Marker for revelation location
let csvData = []; // Parsed CSV data
let currentVerse = null; // Currently selected verse data

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parses CSV text into an array of objects
 * @param {string} text - Raw CSV text content
 * @returns {Array} Array of objects with CSV data
 */
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    });
}

/**
 * Shows a UI element by removing the 'hidden' class
 * @param {string} elementId - ID of the element to show
 */
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('hidden');
    }
}

/**
 * Hides a UI element by adding the 'hidden' class
 * @param {string} elementId - ID of the element to hide
 */
function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

/**
 * Strips HTML tags from text
 * @param {string} html - HTML string
 * @returns {string} Plain text without HTML tags
 */
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetches ayah data from Al-Quran Cloud API
 * @param {number} surahNum - Surah number (1-114)
 * @param {number} ayahNum - Ayah number within the surah
 * @returns {Promise<Object>} Object containing arabic text, translation, and revelation type
 */
async function fetchAyahData(surahNum, ayahNum) {
    try {
        // Al-Quran Cloud API uses format: surah:ayah
        const ayahReference = `${surahNum}:${ayahNum}`;
        
        // Fetch both Arabic text and English translation in one call using editions parameter
        const response = await fetch(
            `${API_BASE_URL}/ayah/${ayahReference}/editions/ar.alafasy,${TRANSLATION_EDITION}`
        );
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ayah data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if data is valid
        if (!data.data || data.data.length < 2) {
            throw new Error('Invalid response format from API');
        }
        
        // data.data[0] contains Arabic text, data.data[1] contains translation
        const arabicData = data.data[0];
        const translationData = data.data[1];
        
        return {
            arabic: arabicData.text || 'Text not available',
            translation: translationData.text || 'Translation not available',
            surahName: arabicData.surah.englishName || `Surah ${surahNum}`,
            surahNameArabic: arabicData.surah.name || '',
            revelationType: arabicData.surah.revelationType || 'Meccan'
        };
    } catch (error) {
        console.error('Error fetching ayah data:', error);
        throw error;
    }
}

// ============================================================================
// MAP FUNCTIONS
// ============================================================================

/**
 * Initializes the Leaflet map
 * Sets up the base map with OpenStreetMap tiles
 */
function initMap() {
    if (map) {
        return; // Map already initialized
    }
    
    // Create map centered on Middle East
    map = L.map('map').setView([25.0, 38.0], 5);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
}

/**
 * Creates custom marker icons for different location types
 * @returns {Object} Object containing icon definitions
 */
function createMarkerIcons() {
    return {
        topic: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 5px; margin-left: 7px; font-size: 16px; color: white;">📍</div></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        }),
        revelation: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #10b981; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 5px; margin-left: 7px; font-size: 16px; color: white;">🕌</div></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        })
    };
}

/**
 * Updates the map to show both topic and revelation locations
 * @param {Object} verseData - Verse data containing location information
 * @param {string} revelationType - Revelation type (Meccan or Medinan) from API
 */
function updateMapWithBothLocations(verseData, revelationType) {
    if (!map) {
        initMap();
    }
    
    // Remove existing markers if present
    if (topicMarker) {
        map.removeLayer(topicMarker);
    }
    if (revelationMarker) {
        map.removeLayer(revelationMarker);
    }
    
    // Convert string coordinates to numbers
    const topicLat = parseFloat(verseData.topic_lat);
    const topicLon = parseFloat(verseData.topic_lon);
    
    // Get revelation location coordinates from API-provided revelation type
    const revelationData = REVELATION_LOCATIONS[revelationType];
    const revelationLat = revelationData.lat;
    const revelationLon = revelationData.lon;
    
    // Create custom icons
    const icons = createMarkerIcons();
    
    // Add topic location marker (blue)
    topicMarker = L.marker([topicLat, topicLon], { icon: icons.topic }).addTo(map);
    topicMarker.bindPopup(`<b>Topic Location</b><br>${verseData.topic_location}`);
    
    // Add revelation location marker (green)
    revelationMarker = L.marker([revelationLat, revelationLon], { icon: icons.revelation }).addTo(map);
    revelationMarker.bindPopup(`<b>Revelation Location</b><br>${revelationData.name}`);
    
    // Fit map bounds to show both markers
    const bounds = L.latLngBounds([
        [topicLat, topicLon],
        [revelationLat, revelationLon]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

/**
 * Populates the dropdown with verse options from CSV data
 * @param {Array} data - Array of verse objects from CSV
 */
function populateDropdown(data) {
    const select = document.getElementById('ayah-select');
    
    data.forEach(verse => {
        const option = document.createElement('option');
        option.value = JSON.stringify(verse);
        option.textContent = `Surah ${verse.surah_number}, Ayah ${verse.ayah_number} - ${verse.description}`;
        select.appendChild(option);
    });
}

/**
 * Displays the selected ayah with its translation and updates the map
 * @param {Object} verseData - Verse data from CSV
 */
async function displayAyah(verseData) {
    // Show loading state
    hideElement('instructions');
    hideElement('error');
    hideElement('arabic-container');
    hideElement('translation-container');
    hideElement('topic-container');
    hideElement('map-controls');
    hideElement('map-wrapper');
    showElement('loading');
    
    try {
        // Fetch ayah data from API
        const ayahData = await fetchAyahData(
            parseInt(verseData.surah_number),
            parseInt(verseData.ayah_number)
        );
        
        // Hide loading
        hideElement('loading');
        
        // Display Arabic text
        document.getElementById('arabic-text').textContent = ayahData.arabic;
        document.getElementById('ayah-reference').textContent = 
            `${ayahData.surahNameArabic || ayahData.surahName} - الآية ${verseData.ayah_number}`;
        showElement('arabic-container');
        
        // Display English translation
        document.getElementById('translation-text').textContent = ayahData.translation;
        showElement('translation-container');
        
        // Display topic information
        document.getElementById('topic-description').textContent = verseData.description;
        document.getElementById('revelation-location').textContent = 
            `Revealed in: ${ayahData.revelationType === 'Meccan' ? 'Mecca' : 'Madinah'}`;
        showElement('topic-container');
        
        // Show map
        showElement('map-wrapper');
        
        // Update map with both locations using API-provided revelation type
        updateMapWithBothLocations(verseData, ayahData.revelationType);
        
    } catch (error) {
        // Show error state
        hideElement('loading');
        document.getElementById('error-message').textContent = error.message;
        showElement('error');
    }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handles verse selection from dropdown
 * Parses the selected verse data and displays it
 */
function handleVerseSelection(event) {
    const selectedValue = event.target.value;
    
    if (!selectedValue) {
        // No selection, show instructions
        hideElement('loading');
        hideElement('error');
        hideElement('arabic-container');
        hideElement('translation-container');
        hideElement('topic-container');
        hideElement('map-wrapper');
        showElement('instructions');
        currentVerse = null;
        return;
    }
    
    try {
        // Parse selected verse data
        currentVerse = JSON.parse(selectedValue);
        
        // Display the verse
        displayAyah(currentVerse);
    } catch (error) {
        console.error('Error parsing verse data:', error);
        document.getElementById('error-message').textContent = 'Error loading verse data';
        showElement('error');
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the application
 * Loads CSV data, sets up event listeners, and prepares the UI
 */
async function init() {
    try {
        // Fetch and parse CSV data
        const response = await fetch('data.csv');
        if (!response.ok) {
            throw new Error('Failed to load data file');
        }
        const csvText = await response.text();
        csvData = parseCSV(csvText);
        
        // Populate dropdown with verse options
        populateDropdown(csvData);
        
        // Set up event listener
        document.getElementById('ayah-select').addEventListener('change', handleVerseSelection);
        
        console.log('QuranMap initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        document.getElementById('error-message').textContent = 
            'Failed to initialize application. Please refresh the page.';
        showElement('error');
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

