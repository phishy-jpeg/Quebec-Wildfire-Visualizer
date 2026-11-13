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
const fireSourceIds = ['feux_prov', 'feux_ancien'];
const fireLayerIds = ['fires-fill', 'fires-ancien-fill'];
const watershedLayerIds = ['watersheds-hit-area', 'watersheds'];
const fireDataStatus = document.getElementById('fire-data-status');

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

// Error for if the data doesnt load (probable due to the size of the data set). Lab 7: usuability
map.on('error', (event) => {
    if (!fireSourceIds.includes(event.sourceId)) return;

    fireDataStatus.textContent = 'Wildfire data could not be loaded. Please refresh the page.';
    fireDataStatus.classList.add('fire-data-status-error');
});

function hideFireDataStatusWhenLoaded() {
    const allFireSourcesLoaded = fireSourceIds.every((sourceId) =>
        map.getSource(sourceId) && map.isSourceLoaded(sourceId)
    );

    if (allFireSourcesLoaded) {
        fireDataStatus.hidden = true;
        map.off('idle', hideFireDataStatusWhenLoaded);
    }
}

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
            'line-color': '#691cc8',
            'line-width': 0.5
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
            'line-width': 0.8
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
        paint: { // So the fire opacity changes when clicked and it is clear the fire border
            'fill-color': '#ff0000',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'clicked'], false],
                0.8,
                0.4
            ],
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
        paint: { // So that the opacity changes when clicked and its clear the fire border
            'fill-color': '#ff0000',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'clicked'], false],
                0.8,
                0.4
            ],
            'fill-outline-color': '#4f0000'
        }
    });

    map.on('idle', hideFireDataStatusWhenLoaded);
    fireLayersLoaded = true;
    updateMapYearFilter(selectedFireYears);

    // Function to highlight the fire when it is clicked: helps with communication of the map.
    let selectedFire = null;
    function highlightFire(feature, source, sourceLayer) {
        if (selectedFire) {
            map.setFeatureState(selectedFire, { clicked: false });
        }

        if (feature.id === undefined || feature.id === null) {
            selectedFire = null;
            console.warn('Cannot highlight this fire because its vector-tile feature has no ID.');
            return;
        }

        selectedFire = { source, sourceLayer, id: feature.id };
        map.setFeatureState(selectedFire, { clicked: true });
    }

    // Show fire details when a fire polygon is clicked.
    map.on('click', 'fires-fill', (e) => {
        const feature = e.features?.[0];
        const properties = feature?.properties;
        if (!properties) return;

        highlightFire(feature, 'feux_prov', 'FEUX_PROV');

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
        const feature = e.features?.[0];
        const properties = feature?.properties;
        if (!properties) return;

        highlightFire(feature, 'feux_ancien', 'FEUX_ANCIENS_PROV');

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
        : years.length === 0
            ? ['==', 'exercice', '__no_year_selected__']
            : [
                'in',
                'exercice',
                ...years.map(String)
            ];

    fireLayerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
            map.setFilter(layerId, filter);
        }
    });
}

// **********************************************************************************************
// FILTERS
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
