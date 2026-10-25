import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs';

// TODO: Add fire filters into the map view so when the map is full screen you can still filter the data
// TODO: Find another revelant data layer to add to the map

// **********************************************************************************************
// MAP OBJECT 
// **********************************************************************************************
// TODO: Choose a final base map to use, that makes sense
const map = new maplibregl.Map({
  container: "map",
  zoom: 4, 
  center: [-70, 53],
  style: "https://tiles.openfreemap.org/styles/dark",
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
const selectedYearsList = document.getElementById('selected-years');
const yearOptions = document.getElementById('year-options');
const yearDropdownLabel = document.getElementById('year-dropdown-label');
const fireCountValue = document.getElementById('fire-count-value');
const selectedYears = new Set();
const fireLayerIds = ['fires-fill', 'fires-ancien-fill'];
const earliestFireYear = 1885;
const latestFireYear = 2025;
// Plus 1 to include both end poits
const availableYears = Array.from({ length: latestFireYear - earliestFireYear + 1 }, (_, index) => latestFireYear - index);
let fireChart;
const fireCountsByYear = {
    "1885": 14, "1887": 18, "1890": 129, "1891": 59,
    "1893": 9, "1894": 313, "1895": 52, "1896": 58,
    "1900": 314, "1901": 69, "1902": 2, "1903": 82,
    "1904": 81, "1905": 408, "1906": 775, "1907": 23,
    "1909": 8, "1910": 354, "1911": 2, "1912": 2,
    "1913": 10, "1914": 61, "1915": 1139, "1916": 2474,
    "1917": 5, "1918": 14, "1919": 434, "1920": 1335,
    "1921": 1282, "1922": 589, "1923": 1343, "1924": 7,
    "1925": 124, "1926": 1, "1927": 46, "1930": 208,
    "1931": 1, "1932": 197, "1933": 233, "1934": 17,
    "1935": 372, "1936": 39, "1937": 42, "1938": 40,
    "1939": 50, "1940": 531, "1941": 910, "1943": 5,
    "1944": 229, "1945": 258, "1946": 5, "1947": 157,
    "1948": 69, "1949": 37, "1950": 462, "1951": 127,
    "1952": 21, "1953": 284, "1954": 10, "1955": 725,
    "1956": 24, "1957": 34, "1958": 3,"1959": 56,
    "1960": 150, "1961": 41, "1962": 288, "1963": 78,
    "1964": 56, "1965": 54, "1966": 12, "1967": 223,
    "1968": 106, "1969": 1, "1970": 26, "1971": 480,
    "1972": 76, "1973": 7, "1974": 32, "1975": 48,
    "1976": 1340, "1977": 228, "1978": 125, "1979": 126,
    "1980": 313, "1981": 344, "1982": 172, "1983": 1922,
    "1984": 180, "1985": 230, "1986": 759, "1987": 284,
    "1988": 558, "1989": 1203, "1990": 288, "1991": 606,
    "1992": 216, "1993": 248, "1994": 148, "1995": 1040,
    "1996": 1822, "1997": 883, "1998": 420, "1999": 201,
    "2000": 222, "2001": 179, "2002": 2504, "2003": 255,
    "2004": 46, "2005": 7778, "2006": 669, "2007": 6080,
    "2008": 89, "2009": 1951, "2010": 22005, "2011": 114,
    "2012": 2756, "2013": 6156, "2014": 124, "2015": 113,
    "2016": 234, "2017": 638, "2018": 2977, "2019": 473,
    "2020": 3615, "2021": 710, "2022": 231, "2023": 16592,
    "2024": 4108, "2025": 297
};

yearOptions.replaceChildren(...availableYears.map((year) => {
    const label = document.createElement('label');
    label.className = 'year-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = String(year);
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            selectedYears.add(year);
        } else {
            selectedYears.delete(year);
        }
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

    yearDropdownLabel.textContent = years.length
        ? `Select years (${years.length} selected)`
        : 'Select years';
    fireCountValue.textContent = new Intl.NumberFormat().format(fireCount);
    yearOptions.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = selectedYears.has(Number(checkbox.value));
    });
    selectedYearsList.replaceChildren(...years.map((year) => {
        const item = document.createElement('li');
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'year-chip';
        removeButton.setAttribute('aria-label', `Remove ${year}`);
        removeButton.textContent = `${year} ×`;
        removeButton.addEventListener('click', () => {
            selectedYears.delete(year);
            updateYearFilter();
        });
        item.append(removeButton);
        return item;
    }));

    if (years.length === 0) {
        fireLayerIds.forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.setFilter(layerId, null);
            }
        });
        yearFilterStatus.textContent = 'Showing fires from all years.';
        updateFireChartSelection();
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
    yearFilterStatus.textContent = `Showing fires for ${years.join(', ')}.`;
    updateFireChartSelection();
}

clearYearFilterButton.addEventListener('click', () => {
    selectedYears.clear();
    updateYearFilter();
});

// **********************************************************************************************
// LOADING MAP LAYERS
// **********************************************************************************************
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
    map.addSource('fires', {
        type: 'vector',
        url: 'http://127.0.0.1:3000/filtered_feux'
    });
    map.addLayer({
        id: 'fires-fill',
        type: 'fill',
        source: 'fires',
        'source-layer': 'filtered_feux',
        paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.3,
            'fill-outline-color': '#4f0000'
        }
    });
    // Adding ancient fire layers
    map.addSource('fires-ancien', {
        type: 'vector',
        url: 'http://127.0.0.1:3000/filtered_feux_ancien'
    });
    map.addLayer({
        id: 'fires-ancien-fill',
        type: 'fill',
        source: 'fires-ancien',
        'source-layer': 'filtered_feux_ancien',
        paint: {
            'fill-color': '#ff0000',
            'fill-opacity': 0.3,
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

//*******************************************************************************
// Creating the graoh 
//******************************************************************************* 
const fireYears = Object.keys(fireCountsByYear).map(Number).sort((a, b) => a - b);
const fireGraphCanvas = document.getElementById('fire-graph');
fireChart = new Chart(fireGraphCanvas, {
    type: 'bar',
    data: {
        labels: fireYears,
        datasets: [{
            label: 'Recorded fires',
            data: fireYears.map((year) => fireCountsByYear[year]),
            backgroundColor: fireYears.map(() => '#1f2d5a'),
            borderColor: '#142756',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
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
                text: 'Recorded wildfires by year'
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
                title: {
                    display: true,
                    text: 'Number of fires'
                }
            }
        }
    }
});

function updateFireChartSelection() {
    if (!fireChart) return;
    fireChart.data.datasets[0].backgroundColor = fireYears.map((year) =>
        selectedYears.size === 0 || selectedYears.has(year) ? '#1f2d5a' : '#cbd2e2'
    );
    fireChart.update();
}
// **********************************************************************************************
// MAP LEGEND
// **********************************************************************************************

// **********************************************************************************************
// TAB FUNCTIONS
// **********************************************************************************************
const tabButtons = document.querySelectorAll('.tablinks');
const tabPanels = document.querySelectorAll('.tab-content');

tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const activePanelId = button.dataset.tab;
        tabButtons.forEach((tabButton) => {
            const isActive = tabButton === button;
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
    });
});
