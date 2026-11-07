import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs';

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

// Creating base map object with maplibre 

const map = new maplibregl.Map({
    container: "map",
    zoom: 4, 
    center: [-70, 53],
    style: {
        version: 8,
        sources: {
        "raster-tiles": {
            type: "raster",
            tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg"],
            tileSize: 256,
            attribution: "<a href=\"https://cloudless.eox.at\">EOxCloudless</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2025)",
        },
        },
        layers: [{ id: "raster-layer", type: "raster", source: "raster-tiles" }],
    },
});

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
            'fill-opacity': 1,
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
            'fill-opacity': 1,
            'fill-outline-color': '#4f0000'
        }
    });

    // Updating year filter on load 
    updateYearFilter();

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

// **********************************************************************************************
// YEAR FILTER
// **********************************************************************************************
// All nescessary constants needed to create my year filter
const clearYearFilterButton = document.getElementById('clear-year-filter');
const yearFilterStatus = document.getElementById('year-filter-status');
const yearOptions = document.getElementById('year-options');
const yearFilterInputFrom = document.getElementById('year-filter-input-from');
const yearFilterInputTo = document.getElementById('year-filter-input-to');
const applyYearRangeButton = document.getElementById('apply-year-range');

const filterToggleButton = document.getElementById('filter-toggle');
const filterPanel = document.getElementById('filter-panel');
const yearFilterToggleButton = document.getElementById('year-filter-toggle');
const yearPanel = document.getElementById('year-panel');
const sizeFilterToggleButton = document.getElementById('size-filter-toggle');
const sizePanel = document.getElementById('size-panel');
const filterHeader = document.getElementById('filter-header-h1');

const fireCountValue = document.getElementById('fire-count-value');
const hectaresCountValue = document.getElementById('hectares-count-value');
const fireLayerIds = ['fires-fill', 'fires-ancien-fill'];

// Loading the JSON file with the per year values
async function loadperYearData() {
    try {
        const response = await fetch('../site/data/fire_counts_by_year.json');
        if (!response.ok) {
            console.log("!response.ok");
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching per-year data:', error);
    }
}
const perYearData = await loadperYearData();

const fireCountsByYear = Object.fromEntries(
    Object.entries(perYearData).map(([year, data]) => [year, data.fires])
);

const hectaresCountByYear = Object.fromEntries(
    Object.entries(perYearData).map(([year, data]) => [year, data.hectares])
);

const earliestFireYear = Math.min(...Object.keys(perYearData));
const latestFireYear = Math.max(...Object.keys(perYearData));

// Plus 1 to include both end poits
const availableYears = Array.from({ length: latestFireYear - earliestFireYear + 1 }, (_, index) => latestFireYear - index);
const selectedYears = new Set(availableYears);
let fireChart;

yearFilterInputFrom.min = String(earliestFireYear);
yearFilterInputFrom.max = String(latestFireYear);
yearFilterInputFrom.value = String(earliestFireYear);
yearFilterInputTo.min = String(earliestFireYear);
yearFilterInputTo.max = String(latestFireYear);
yearFilterInputTo.value = String(latestFireYear);

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

function updateYearFiltersFromInput() {
    const fromYear = yearFilterInputFrom.valueAsNumber;
    const toYear = yearFilterInputTo.valueAsNumber;

    if (!Number.isInteger(fromYear) || !Number.isInteger(toYear)) {
        yearFilterStatus.textContent = 'Enter a whole year in both fields.';
        return;
    }

    if (fromYear < earliestFireYear || fromYear > latestFireYear ||
        toYear < earliestFireYear || toYear > latestFireYear) {
        yearFilterStatus.textContent = `Enter years from ${earliestFireYear} to ${latestFireYear}.`;
        return;
    }

    if (fromYear > toYear) {
        yearFilterStatus.textContent = 'The starting year must be earlier than or equal to the ending year.';
        return;
    }

    selectedYears.clear();
    for (let year = fromYear; year <= toYear; year += 1) {
        selectedYears.add(year);
    }
    updateYearFilter();
}
applyYearRangeButton.addEventListener('click', updateYearFiltersFromInput);
[yearFilterInputFrom, yearFilterInputTo].forEach((input) => {
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            updateYearFiltersFromInput();
        }
    });
});

// Changing the years shown on the map
yearOptions.replaceChildren(...availableYears.map((year) => {
    const label = document.createElement('label');
    label.className = 'year-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = String(year);
    checkbox.checked = selectedYears.has(year);
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            selectedYears.add(year);
        } else {
            selectedYears.delete(year);
        }
        yearFilterStatus.textContent = '';
        updateYearFilter();
    });
    label.append(checkbox, document.createTextNode(String(year)));
    return label;
}));

function updateYearFilter() {
    const years = [...selectedYears].sort((a, b) => b - a);
    const fireCount = years.length
        ? years.reduce((total, year) => total + (fireCountsByYear[year] ?? 0), 0)
        : Object.values(fireCountsByYear).reduce((total, count) => total + count, 0);
    const hectaresCount = years.length
        ? years.reduce((total, year) => total + (hectaresCountByYear[year] ?? 0), 0)
        : Object.values(hectaresCountByYear).reduce((total, count) => total + count, 0);

    fireCountValue.textContent = new Intl.NumberFormat().format(fireCount);
    hectaresCountValue.textContent = new Intl.NumberFormat().format(hectaresCount);
    yearOptions.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = selectedYears.has(Number(checkbox.value));
    });
    updateFireChartSelection();

    if (years.length === 0 || years.length === availableYears.length) {
        fireLayerIds.forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.setFilter(layerId, null);
            }
        });
        return;
    }

    const yearExpression = [
        'coalesce',
        ['to-number', ['get', 'an_origine']],
        ['to-number', ['get', 'exercice']],
        -1
    ];
    const selectedYearFilter = [
        'in',
        yearExpression,
        ['literal', years]
    ];
    fireLayerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
            map.setFilter(layerId, selectedYearFilter);
        }
    });
}

clearYearFilterButton.addEventListener('click', () => {
    selectedYears.clear();
    availableYears.forEach((year) => selectedYears.add(year));
    yearFilterInputFrom.value = String(earliestFireYear);
    yearFilterInputTo.value = String(latestFireYear);
    yearFilterStatus.textContent = 'Showing fires from all years.';
    updateYearFilter();
});


//*******************************************************************************
// Creating the graoh 
//******************************************************************************* 
function getSelectedFireYears() {
    const yearsToShow = selectedYears.size === 0
        ? availableYears
        : [...selectedYears];

    return yearsToShow
        .filter((year) =>
            Object.hasOwn(fireCountsByYear, year) &&
            Object.hasOwn(hectaresCountByYear, year)
        )
        .sort((a, b) => a - b);
}

function updateFireChartSelection() {
    if (!fireChart) return;

    const years = getSelectedFireYears();
    fireChart.data.labels = years;
    fireChart.data.datasets[0].data = years.map((year) => fireCountsByYear[year]);
    fireChart.data.datasets[1].data = years.map((year) => hectaresCountByYear[year]);
    fireChart.update();
}

const fireYears = getSelectedFireYears();
const fireHectares = fireYears.map((year) => hectaresCountByYear[year]);

const fireGraphCanvas = document.getElementById('fire-graph');

fireChart = new Chart(fireGraphCanvas, {
    type: 'bar',
    data: {
        labels: fireYears,
        datasets: [
            {
            label: 'Recorded fires',
            data: fireYears.map((year) => fireCountsByYear[year]),
            backgroundColor: fireYears.map(() => '#1f2d5a'),
            borderColor: '#142756',
            borderWidth: 1,
            yAxisID: 'y'
            },
            {
            label: 'Hectares burned',
            data: fireHectares,
            backgroundColor: fireYears.map(() => '#400002'),
            borderColor: '#400002',
            borderWidth: 1,
            yAxisID: 'y1'
            }
        ]}, 
        options: {
            responsive: true,
            onClick: (event, activeElements, chart) => {
                // If use didnt click ie. not active elements do not continue
                if (activeElements.length === 0) return;

                // Creating 
                const year = Number(chart.data.labels[activeElements[0].index]);

                // Changing the selected years to match the year clicked
                selectedYears.clear();
                selectedYears.add(year);
                updateYearFilter();
            
                // Switching to the map tab
                document.getElementById('map-tab').click();
            },
            maintainAspectRatio: false,
            interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Recorded wildfires and Total Hectares Burned by year'
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Year'
                }
            },
            y: {
                beginAtZero: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Number of fires'
                }
            },
            y1: {
                beginAtZero: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Hectares burned'
                }
            }
        }
    }
});

// **********************************************************************************************
// TAB FUNCTIONS
// **********************************************************************************************
const tabButtons = document.querySelectorAll('.tablinks');
const tabPanels = document.querySelectorAll('.tab-content');
const chart = document.querySelectorAll('.graph');

function changeTab(event) {
    const clickedTabButton = event.currentTarget;
    const activePanelId = clickedTabButton.dataset.tab;

    tabButtons.forEach((tabButton) => {
        const isActive = tabButton === clickedTabButton;
        tabButton.classList.toggle('active', isActive);
        tabButton.setAttribute('aria-selected', String(isActive));
    });
    tabPanels.forEach((panel) => {
        panel.classList.toggle('active', panel.id === activePanelId);
    });

    if (activePanelId === 'map') {
        map.resize();
    } else if (activePanelId === 'graph') {
        fireChart.resize();
    }
}
tabButtons.forEach((button) => {
    button.addEventListener('click', changeTab);
});
