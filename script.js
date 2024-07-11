document.addEventListener("DOMContentLoaded", () => {
    const drinkForm = document.getElementById("drink-form");
    const drinkSelect = document.getElementById("drink");
    const customDrinkFields = document.getElementById("custom-drink-fields");
    const customNameInput = document.getElementById("custom-name");
    const caffeineContentInput = document.getElementById("caffeine-content");
    const volumeInput = document.getElementById("volume");
    const timeInput = document.getElementById("time");
    const toggleListButton = document.getElementById("toggle-list");
    const drinkListSection = document.getElementById("drink-list");
    const drinksUL = document.getElementById("drinks-ul");
    const clearListButton = document.getElementById("clear-list");
    const ctx = document.getElementById('caffeine-chart').getContext('2d');
    const currentCaffeineValue = document.getElementById('current-caffeine-value');

    // Chart.js initial configuration
    let caffeineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Caffeine Concentration (mg/L)',
                data: new Array(24).fill(0),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                lineTension: 0.4
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Caffeine Concentration (mg/L)'
                    },
                    suggestedMin: 0 // Ensure the y-axis starts at 0
                }
            }
        }
    });

    const caffeineHalfLife = 5; // Caffeine half-life in hours

    // Event Listeners
    drinkSelect.addEventListener("change", () => {
        if (drinkSelect.value === "custom") {
            customDrinkFields.classList.remove("hidden");
        } else {
            customDrinkFields.classList.add("hidden");
        }
    });

    drinkForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        let drinkName = drinkSelect.value;
        let caffeineContent = 0;

        if (drinkName === "coffee") {
            caffeineContent = 95; // mg per 240 ml
        } else if (drinkName === "tea") {
            caffeineContent = 47; // mg per 240 ml
        } else if (drinkName === "custom") {
            drinkName = customNameInput.value;
            caffeineContent = parseFloat(caffeineContentInput.value);
        }

        const volume = parseFloat(volumeInput.value);
        const time = timeInput.value;
        const totalCaffeine = (caffeineContent * volume) / 240; // Assuming 240ml as standard serving

        logDrink(drinkName, volume, totalCaffeine, time);
        updateChart();
        updateDrinkList(); // Update the drink list when a new drink is added
        updateCurrentCaffeine();
    });

    toggleListButton.addEventListener("click", () => {
        drinkListSection.classList.toggle("hidden");
        if (!drinkListSection.classList.contains("hidden")) {
            toggleListButton.textContent = "Hide List";
        } else {
            toggleListButton.textContent = "Show List";
        }
    });

    clearListButton.addEventListener("click", () => {
        localStorage.removeItem("drinks");
        updateDrinkList(); // Update the drink list to reflect removal of all drinks
        resetChart(); // Reset the chart after clearing all drinks
        updateCurrentCaffeine();
    });

    function logDrink(name, volume, caffeine, time) {
        const now = new Date();
        const drinkTime = new Date(`${now.toDateString()} ${time}`);

        const drink = {
            name,
            volume,
            caffeine,
            time: drinkTime.getTime() // Store as timestamp
        };

        let drinks = JSON.parse(localStorage.getItem("drinks")) || [];
        drinks.push(drink);
        localStorage.setItem("drinks", JSON.stringify(drinks));
    }

    function updateChart() {
        const drinks = JSON.parse(localStorage.getItem("drinks")) || [];
        const now = new Date();
        const hoursInDay = 24;

        // Reset data
        const concentrations = new Array(hoursInDay).fill(0);

        drinks.forEach(drink => {
            const drinkTime = new Date(drink.time);
            const drinkHour = drinkTime.getHours();
            const hoursSinceDrink = (now - drinkTime) / (1000 * 60 * 60); // Time difference in hours

            // Accumulate concentrations forward from drink time to end of day
            for (let i = drinkHour; i < hoursInDay; i++) {
                const hoursElapsed = i - drinkHour;
                const caffeineLeft = drink.caffeine * Math.pow(0.5, hoursElapsed / caffeineHalfLife);
                concentrations[i] += caffeineLeft;
            }
        });

        caffeineChart.data.datasets[0].data = concentrations;
        caffeineChart.update();
    }

    function resetChart() {
        caffeineChart.data.datasets[0].data.fill(0);
        caffeineChart.update();
    }

    function updateDrinkList() {
        const drinks = JSON.parse(localStorage.getItem("drinks")) || [];
        drinksUL.innerHTML = "";

        drinks.forEach((drink, index) => {
            const drinkTime = new Date(drink.time);
            const formattedTime = `${drinkTime.getHours()}:${String(drinkTime.getMinutes()).padStart(2, '0')}`;
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${drink.name}</strong> - Volume: ${drink.volume} ml - Caffeine: ${drink.caffeine.toFixed(2)} mg - Time: ${formattedTime}`;
            
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.classList.add("remove-button");
            removeButton.addEventListener("click", () => {
                let drinks = JSON.parse(localStorage.getItem("drinks")) || [];
                drinks.splice(index, 1);
                localStorage.setItem("drinks", JSON.stringify(drinks));
                updateDrinkList(); // Update the displayed list
                updateChart(); // Update the chart after removing a drink
                updateCurrentCaffeine(); // Update current caffeine after removing a drink
            });

            listItem.appendChild(removeButton);
            drinksUL.appendChild(listItem);
        });
    }

    function updateCurrentCaffeine() {
        const drinks = JSON.parse(localStorage.getItem("drinks")) || [];
        const now = new Date();
        let totalCaffeine = 0;

        drinks.forEach(drink => {
            const drinkTime = new Date(drink.time);
            const hoursSinceDrink = (now - drinkTime) / (1000 * 60 * 60); // Time difference in hours
            const caffeineLeft = drink.caffeine * Math.pow(0.5, hoursSinceDrink / caffeineHalfLife);
            totalCaffeine += caffeineLeft;
        });

        currentCaffeineValue.textContent = totalCaffeine.toFixed(2);
    }

    // Initial call to display drinks and update chart when page is loaded
    updateDrinkList();
    updateChart();
    updateCurrentCaffeine();
});
