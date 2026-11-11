const selectedYearsStorageKey = 'quebec-wildfire-selected-years';

export async function initializeYearFilter(onChange) {
    const response = await fetch(new URL('../data/fire_counts_by_year.json', import.meta.url));
    if (!response.ok) {
        throw new Error(`Could not load yearly fire data (HTTP ${response.status}).`);
    }

    const perYearData = await response.json();
    const fireCountsByYear = Object.fromEntries(
        Object.entries(perYearData).map(([year, data]) => [year, data.fires])
    );
    const hectaresCountByYear = Object.fromEntries(
        Object.entries(perYearData).map(([year, data]) => [year, data.hectares])
    );
    const years = Object.keys(perYearData).map(Number);
    const earliestYear = Math.min(...years);
    const latestYear = Math.max(...years);
    const availableYears = Array.from(
        { length: latestYear - earliestYear + 1 },
        (_, index) => latestYear - index
    );

    let selectedYears = new Set(availableYears);
    const clearButton = document.getElementById('clear-year-filter');
    const clearSelectionButton = document.getElementById('clear-year-selection');
    const status = document.getElementById('year-filter-status');
    const yearsShown = document.getElementById('years-shown');
    const selectionCount = document.getElementById('year-selection-count');
    const options = document.getElementById('year-options');
    const fromInput = document.getElementById('year-filter-input-from');
    const toInput = document.getElementById('year-filter-input-to');
    const addRangeButton = document.getElementById('add-year-range');
    const newSelectionButton = document.getElementById('new-year-selection');
    const fireCountValue = document.getElementById('fire-count-value');
    const hectaresCountValue = document.getElementById('hectares-count-value');

    function getYearsForDisplay() {
        return [...selectedYears].sort((a, b) => a - b);
    }

    function formatYearRanges(selected) {
        if (selected.length === 0) return 'None';

        const ranges = [];
        let rangeStart = selected[0];
        let rangeEnd = selected[0];

        for (const year of selected.slice(1)) {
            if (year === rangeEnd + 1) {
                rangeEnd = year;
                continue;
            }

            ranges.push(rangeStart === rangeEnd ? String(rangeStart) : `${rangeStart}-${rangeEnd}`);
            rangeStart = year;
            rangeEnd = year;
        }

        ranges.push(rangeStart === rangeEnd ? String(rangeStart) : `${rangeStart}-${rangeEnd}`);
        return ranges.join(', ');
    }

    function render(message = '', persist = true, syncRangeInputs = true) {
        if (persist) {
            try {
                localStorage.setItem(selectedYearsStorageKey, JSON.stringify([...selectedYears]));
            } catch (error) {
                console.error('Could not save the selected year filter:', error);
            }
        }

        const selected = getYearsForDisplay();
        const fireCount = selected.reduce(
            (total, year) => total + (fireCountsByYear[year] ?? 0), 0
        );
        const hectaresCount = selected.reduce(
            (total, year) => total + (hectaresCountByYear[year] ?? 0), 0
        );

        if (fireCountValue) {
            fireCountValue.textContent = new Intl.NumberFormat().format(fireCount);
        }
        if (hectaresCountValue) {
            hectaresCountValue.textContent = new Intl.NumberFormat().format(hectaresCount);
        }
        if (status) {
            status.textContent = message;
        }
        if (yearsShown) {
            yearsShown.textContent = `Years shown: ${formatYearRanges(selected)}`;
        }
        if (selectionCount) {
            selectionCount.textContent = `${selected.length} of ${availableYears.length} years selected`;
        }
        if (options) {
            options.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
                checkbox.checked = selectedYears.has(Number(checkbox.value));
            });
        }
        if (syncRangeInputs && fromInput && toInput) {
            fromInput.value = selected.length ? String(selected[0]) : '';
            toInput.value = selected.length ? String(selected[selected.length - 1]) : '';
        }
        onChange(selected, availableYears);
    }

    function setSelectedYears(yearList, message = '') {
        selectedYears = new Set(yearList.filter((year) => availableYears.includes(year)));
        render(message);
    }

    try {
        const savedYears = JSON.parse(localStorage.getItem(selectedYearsStorageKey));
        if (Array.isArray(savedYears)) {
            selectedYears = new Set(
                savedYears.filter((year) => Number.isInteger(year) && availableYears.includes(year))
            );
        }
    } catch (error) {
        console.error('Could not read the saved year filter:', error);
    }

    if (fromInput && toInput) {
        for (const input of [fromInput, toInput]) {
            input.min = String(earliestYear);
            input.max = String(latestYear);
        }
        fromInput.value = String(earliestYear);
        toInput.value = String(latestYear);
    }

    if (options) {
        options.replaceChildren(...availableYears.map((year) => {
            const label = document.createElement('label');
            label.className = 'year-option';
            label.dataset.year = String(year);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = String(year);
            checkbox.checked = selectedYears.has(year);
            checkbox.addEventListener('change', () => {
                const nextYears = new Set(selectedYears);
                if (checkbox.checked) {
                    nextYears.add(year);
                } else {
                    nextYears.delete(year);
                }
                setSelectedYears([...nextYears]);
            });
            label.append(checkbox, document.createTextNode(String(year)));
            return label;
        }));
    }

    function applyYearRange(addToSelection) {
        if (!fromInput || !toInput) return;

        const fromYear = fromInput.valueAsNumber;
        const toYear = toInput.valueAsNumber;
        if (!Number.isInteger(fromYear) || !Number.isInteger(toYear)) {
            render('Enter a whole year in both fields.', false, false);
            return;
        }
        if (fromYear < earliestYear || fromYear > latestYear ||
            toYear < earliestYear || toYear > latestYear) {
            render(`Enter years from ${earliestYear} to ${latestYear}.`, false, false);
            return;
        }
        if (fromYear > toYear) {
            render('The starting year must be earlier than or equal to the ending year.', false, false);
            return;
        }

        const rangeYears = availableYears.filter((year) => year >= fromYear && year <= toYear);
        const nextYears = addToSelection
            ? new Set([...selectedYears, ...rangeYears])
            : new Set(rangeYears);
        setSelectedYears([...nextYears], '', false);
    }

    addRangeButton?.addEventListener('click', () => applyYearRange(true));
    newSelectionButton?.addEventListener('click', () => applyYearRange(false));
    [fromInput, toInput].filter(Boolean).forEach((input) => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') applyYearRange(false);
        });
    });

    clearButton?.addEventListener('click', () => {
        setSelectedYears(availableYears, 'Showing fires from all years.');
    });

    clearSelectionButton?.addEventListener('click', () => {
        setSelectedYears([], 'No years selected.');
    });

    window.addEventListener('storage', (event) => {
        if (event.key !== selectedYearsStorageKey && event.key !== null) return;

        try {
            const savedYears = event.newValue === null
                ? availableYears
                : JSON.parse(event.newValue);
            if (!Array.isArray(savedYears)) {
                throw new TypeError('Saved year filter must be an array.');
            }
            selectedYears = new Set(
                savedYears.filter((year) => Number.isInteger(year) && availableYears.includes(year))
            );
            render('', false);
        } catch (error) {
            console.error('Could not synchronize the saved year filter:', error);
        }
    });

    render('', false);
    return {
        availableYears,
        fireCountsByYear,
        hectaresCountByYear,
        setSelectedYears
    };
}
