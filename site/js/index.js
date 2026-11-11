import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs';
import { initializeYearFilter } from './year-filter.js';

// TODO: THIS CODE IS A MESS ORGANIZE IT BETTER 
// TODO: Add new layer for the fire layers, since the current one does not have unique ID's.
// **********************************************************************************************
// MAP OBJECT 
// **********************************************************************************************

// Registering the map with pmtiles protocol
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// Creating consts for the pmtiles url
const fireUrl = new URL('../data/FEUX_PROV.pmtiles', import.meta.url).href;
const fireAnciensUrl = new URL('../data/FEUX_ANCIENS_PROV.pmtiles', import.meta.url).href;
const fireLayerIds = ['fires-fill', 'fires-ancien-fill'];
const watershedLayerIds = ['watersheds-hit-area', 'watersheds'];

// Creating base map object with maplibre 
const map = new maplibregl.Map({
    container: "map",
    zoom: 4, 
    center: [-70, 53],
    style: "https://styles.maptoolkit.org/summer.json",
    // Maptoolkit's terms require its credit to stay fully visible.
    attributionControl: { compact: false },
});
// Adding a scale 
const scale = new maplibregl.ScaleControl({
  unit: 'metric'       
});
map.addControl(scale, 'bottom-left');

// LOADING MAP LAYERS
map.on('load', () => {
    // Watershed layer 
    map.addSource('quebec-watersheds', {
        'type': 'geojson',
        'data': 'data/watersheds.geojson', 
    });
    map.addLayer({
        'id': 'watersheds-hit-area',
        'type': 'fill',
        'source': 'quebec-watersheds',
        'layout': {
            'visibility': watershedsToggle.checked ? 'visible' : 'none'
        },
        'paint': {
            'fill-color': '#0050ac',
            'fill-opacity': 0.01
        }
    });
    map.addLayer({
        'id': 'watersheds',
        'type': 'line',
        'source': 'quebec-watersheds',
        'layout': {
            'visibility': watershedsToggle.checked ? 'visible' : 'none'
        },
        'paint': {
            'line-color': '#0050ac',
            'line-width': 1
        }
    });
    map.on('click', 'watersheds-hit-area', (e) => {
        const properties = e.features?.[0]?.properties;
        if (!properties) return;

        const popupContent = document.createElement('div');
        popupContent.textContent = "Watershed: " + properties.watershed_name ?? 'Watershed name unavailable';

        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setDOMContent(popupContent)
            .addTo(map);
    });
    map.on('mouseenter', 'watersheds-hit-area', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'watersheds-hit-area', () => {
        map.getCanvas().style.cursor = '';
    });
    // Border layer
    map.addSource('quebec-border', {
        'type': 'geojson',
        'data': 'data/quebec_polygon.geojson', 
    });
    map.addLayer({
        'id': 'quebec-border',
        'type': 'line',
        'source': 'quebec-border',
        'layout': {
            'visibility': quebecBorderToggle.checked ? 'visible' : 'none'
        },
        'paint': {
            'line-color': '#000000',
            'line-width': 1
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
    // Adding ancien fire layers
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

    // Show fire details when a fire polygon is clicked.
    map.on('click', 'fires-fill', (e) => {
        const properties = e.features[0].properties;
        if (!properties) return;

        // Showing fire size and year in the pop up
        const year = properties.exercice ?? 'Unknown'; // Year
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
        const properties = e.features[0].properties;
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

// MAP YEAR FILTER 
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
const layersFilterToggleButton = document.getElementById('layers-filter-toggle');
const layersPanel = document.getElementById('layers-panel');
const watershedsToggle = document.getElementById('watersheds-toggle');
const quebecBorderToggle = document.getElementById('quebec-border-toggle');
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

function updateLayersFilterToggleState() {
    layersFilterToggleButton.setAttribute('aria-expanded', String(!layersPanel.hidden));
}

layersFilterToggleButton.addEventListener('click', () => {
    layersPanel.hidden = !layersPanel.hidden;
    updateLayersFilterToggleState();
});
updateLayersFilterToggleState();

watershedsToggle.addEventListener('change', () => {
    watershedLayerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', watershedsToggle.checked ? 'visible' : 'none');
        }
    });
});
quebecBorderToggle.addEventListener('change', () => {
    if (map.getLayer('quebec-border')) {
        map.setLayoutProperty(
            'quebec-border',
            'visibility',
            quebecBorderToggle.checked ? 'visible' : 'none'
        );
    }
});


await initializeYearFilter(updateMapYearFilter);
