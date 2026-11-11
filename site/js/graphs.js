// Import so that the map and chart pages will work together 
import { initializeYearFilter } from './year-filter.js';

let fireChart;
let selectedYears = [];
// Creating a year filter 
const yearFilter = await initializeYearFilter((years) => {
    selectedYears = years;
    if (!fireChart) return;

    fireChart.data.labels = years;
    fireChart.data.datasets[0].data = years.map((year) => yearFilter.fireCountsByYear[year] ?? 0);
    fireChart.data.datasets[1].data = years.map((year) => yearFilter.hectaresCountByYear[year] ?? 0);
    fireChart.update();
});

// Creating a chart 
fireChart = new Chart(document.getElementById('fire-graph'), {
    type: 'bar',
    data: {
        labels: selectedYears,
        // Adding in the fire counts by year and hectares by year datasets (created in my jupyter notebooks)
        datasets: [
            {
                label: 'Recorded fires',
                data: selectedYears.map((year) => yearFilter.fireCountsByYear[year] ?? 0),
                backgroundColor: '#1f2d5a',
                borderColor: '#142756',
                borderWidth: 1,
                yAxisID: 'y'
            },
            {
                label: 'Hectares burned',
                data: selectedYears.map((year) => yearFilter.hectaresCountByYear[year] ?? 0),
                backgroundColor: '#400002',
                borderColor: '#400002',
                borderWidth: 1,
                yAxisID: 'y1'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        onClick: (event, activeElements, chart) => {
            if (activeElements.length === 0) return;
            const year = Number(chart.data.labels[activeElements[0].index]);
            yearFilter.setSelectedYears([year]);
        },
        plugins: {
            title: {
                display: true,
                text: 'Recorded wildfires and hectares burned by year'
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
            y1: { // Second y scale 
                beginAtZero: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false
                },
                title: {
                    display: true,
                    text: 'Hectares burned'
                }
            }
        }
    }
});
