import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs';
import { initializeYearFilter } from './year-filter.js';
import { ScaleControl } from 'maplibre-gl';

// TODO: THIS CODE IS A MESS ORGANIZE IT BETTER 
// TODO: Add fire filters into the map view so when the map is full screen you can still filter the data
// TODO: Find another revelant data layer to add to the map
// **********************************************************************************************
// MAP OBJECT 
// **********************************************************************************************
// TODO: Choose a final base map to use, that makes sense

// Registering the map with pmtiles protocol
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// Creating consts for the pmtiles url
const fireUrl = new URL('../data/FEUX_PROV.pmtiles', import.meta.url).href;
const fireAnciensUrl = new URL('../data/FEUX_ANCIENS_PROV.pmtiles', import.meta.url).href;
const fireLayerIds = ['fires-fill', 'fires-ancien-fill'];


// Creating base map object with maplibre 

const map = new maplibregl.Map({
    container: "map",
    zoom: 4, 
    center: [-70, 53],
    style: "https://styles.maptoolkit.org/summer.json",
    // Maptoolkit's terms require its credit to stay fully visible.
    attributionControl: { compact: false },
});
const scale = new ScaleControl({
  unit: 'metric'       
});

map.addControl(scale, 'bottom-left');

// LOADING MAP LAYERS
map.on('load', () => {
    // Border layer
    map.addSource('quebec-border', {
        'type': 'geojson',
        'data': 'data/clean_SDA.geojson',
    });
    map.addLayer({
        'id': 'quebec-borders',
        'type': 'line',
        'source': 'quebec-border',
        'paint': {
            'line-color': '#fefeff',
            'line-width': 0.1
        }
    });
    // fires layer
    map.addSource('feux_prov', {
        type: 'vector',
        url:  `pmtiles://${fireUrl}`,
    });
    map.addLayer({
        id: 'fires-fill',
        type: 'fill',
        source: 'feux_prov',
        'source-layer': 'FEUX_PROV',
        paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.4,
            'fill-outline-color': '#4f0000'
        }
    });
    // Adding ancient fire layers
    map.addSource('feux_ancien', {
        type: 'vector',
        url:  `pmtiles://${fireAnciensUrl}`,
    });
    map.addLayer({
        id: 'fires-ancien-fill',
        type: 'fill',
        source: 'feux_ancien',
        'source-layer': 'FEUX_ANCIENS_PROV',
        paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.4,
            'fill-outline-color': '#4f0000'
        }
    });

    fireLayersLoaded = true;
    updateMapYearFilter(selectedFireYears);

    // Show fire-year details when a fire polygon is clicked.
    map.on('click', 'fires-fill', (e) => {
        const properties = e.features?.[0]?.properties;
        if (!properties) return;

        // Showing fire size and year in the pop up
        const year = properties.an_origine ?? properties.exercice ?? 'Unknown'; // Year
        const area = properties.superficie ?? 'Unknown'; // Size (ha) 

        // Creating a pop up element with the year and size 
        const popupContent = document.createElement('div');
        popupContent.textContent = `Fire year: ${year}\nFire size (ha): ${area}`;

        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setDOMContent(popupContent)
            .addTo(map);
    });

    map.on('mouseenter', 'fires-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'fires-fill', () => {
        map.getCanvas().style.cursor = '';
    });
    // Show fire-year details when a pre 1976 fire polygon is clicked.
    map.on('click', 'fires-ancien-fill', (e) => {
        const properties = e.features?.[0]?.properties;
        if (!properties) return;

        // Showing fire size and year in the pop up
        const year = properties.an_origine ?? properties.exercice ?? 'Unknown'; // Year
        const area = properties.superficie ?? 'Unknown'; // Size (ha) 

        // Creating a pop up element with the year and size 
        const popupContent = document.createElement('div');
        popupContent.textContent = `Fire year: ${year}\nFire size (ha): ${area}`;

        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setDOMContent(popupContent)
            .addTo(map);
    });

    map.on('mouseenter', 'fires-ancien-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'fires-ancien-fill', () => {
        map.getCanvas().style.cursor = '';
    });
});
// Full screen control
map.addControl(new maplibregl.FullscreenControl());

// zoom and rotation controls 
map.addControl(new maplibregl.NavigationControl({
    visualizePitch: true,
    visualizeRoll: true,
    showZoom: true,
    showCompass: true,
}));

let selectedFireYears = [];
let availableFireYears = [];
let fireLayersLoaded = false;

function updateMapYearFilter(years, allYears = availableFireYears) {
    selectedFireYears = years;
    availableFireYears = allYears;
    if (!fireLayersLoaded) return;

    const filter = years.length === allYears.length
        ? null
        : [
            'in',
            [
                'coalesce',
                ['to-number', ['get', 'an_origine']],
                ['to-number', ['get', 'exercice']],
                -1
            ],
            ['literal', years]
        ];

    fireLayerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
            map.setFilter(layerId, filter);
        }
    });
}

// **********************************************************************************************
// YEAR FILTER
// **********************************************************************************************
const filterToggleButton = document.getElementById('filter-toggle');
const filterPanel = document.getElementById('filter-panel');
const yearFilterToggleButton = document.getElementById('year-filter-toggle');
const yearPanel = document.getElementById('year-panel');
const sizeFilterToggleButton = document.getElementById('size-filter-toggle');
const sizePanel = document.getElementById('size-panel');
const filterHeader = document.getElementById('filter-header-h1');

// Expanding filter section, and toggle animations
filterToggleButton.addEventListener('click', () => {
    filterPanel.hidden = !filterPanel.hidden;
    filterHeader.hidden = !filterHeader.hidden;
    filterToggleButton.classList.toggle('change', !filterPanel.hidden);
    filterToggleButton.setAttribute('aria-expanded', String(!filterPanel.hidden));

    filterToggleButton.classList.toggle('change', !filterHeader.hidden);
    filterToggleButton.setAttribute('aria-expanded', String(!filterHeader.hidden));
});
filterToggleButton.setAttribute('aria-expanded', String(!filterPanel.hidden));
filterToggleButton.setAttribute('aria-expanded', String(!filterHeader.hidden));

function updateYearFilterToggleState() {
    yearFilterToggleButton.setAttribute('aria-expanded', String(!yearPanel.hidden));
}

// Expanding year selection panel
yearFilterToggleButton.addEventListener('click', () => {
    yearPanel.hidden = !yearPanel.hidden;
    updateYearFilterToggleState();
});
updateYearFilterToggleState();

function updateSizeFilterToggleState() {
    sizeFilterToggleButton.setAttribute('aria-expanded', String(!sizePanel.hidden));
}

// Expanding size selection panel
sizeFilterToggleButton.addEventListener('click', () => {
    sizePanel.hidden = !sizePanel.hidden;
    updateSizeFilterToggleState();
});
updateSizeFilterToggleState();

await initializeYearFilter(updateMapYearFilter);
