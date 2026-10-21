import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs';

// **********************************************************************************************
// MAP OBJECT 
// **********************************************************************************************

// Initializing the map object with satelite data from MapLibre 
/*const map = new maplibregl.Map({
    container: 'map',
    zoom: 4,
    center: [-70, 53],
    style: {
        "version": 8,
        "sources": {
            "satellite": {
                "type": "raster",
                "tiles": [
                    "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg"
                ],
                "tileSize": 256
            }
        },
        "layers": [{
            "id": "satellite",
            "type": "raster",
            "source": "satellite"
        }]
    }
});*/

// Map object 
// TODO: Choose a final base map to use, that makes sense
const map = new maplibregl.Map({
  container: "map",
  zoom: 4, 
  center: [-70, 53],
  style: "https://tiles.openfreemap.org/styles/dark",
});

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
const fireCountPeriod = document.getElementById('fire-count-period');
const selectedYears = new Set();
const availableYears = Array.from({ length: 51 }, (_, index) => 2026 - index);
// Perhaps a better way to do this? 
// TODO: see if I can query directly from my database? or see if this is more efficient idk 
const fireCountsByYear = {
    1976: 1340, 1977: 228, 1978: 125, 1979: 126, 1980: 313,
    1981: 344, 1982: 172, 1983: 1922, 1984: 180, 1985: 230,
    1986: 759, 1987: 284, 1988: 558, 1989: 1203, 1990: 288,
    1991: 606, 1992: 216, 1993: 248, 1994: 148, 1995: 1040,
    1996: 1822, 1997: 883, 1998: 420, 1999: 201, 2000: 222,
    2001: 179, 2002: 2504, 2003: 255, 2004: 46, 2005: 7778,
    2006: 669, 2007: 6080, 2008: 89, 2009: 1951, 2010: 22005,
    2011: 114, 2012: 2756, 2013: 6156, 2014: 124, 2015: 113,
    2016: 234, 2017: 638, 2018: 2977, 2019: 473, 2020: 3615,
    2021: 710, 2022: 231, 2023: 16592, 2024: 4108, 2025: 297,
    2026: 0
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
        if (map.getLayer('fires-fill')) {
            map.setFilter('fires-fill', null);
        }
        yearFilterStatus.textContent = 'Showing fires from all years.';
        return;
    }

    if (map.getLayer('fires-fill')) {
        const yearExpression = [
            'to-number',
            ['coalesce', ['get', 'an_origine'], ['get', 'exercice']],
            -1
        ];
        map.setFilter('fires-fill', [
            'in',
            yearExpression,
            ['literal', years]
        ]);
    }
    yearFilterStatus.textContent = `Showing fires for ${years.join(', ')}.`;
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
});
