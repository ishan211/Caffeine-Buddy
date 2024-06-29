document.addEventListener("DOMContentLoaded", () => {
    const drinkForm = document.getElementById("drink-form");
    const drinkSelect = document.getElementById("drink");
    const customDrinkFields = document.getElementById("custom-drink-fields");
    const customNameInput = document.getElementById("custom-name");
    const caffeineContentInput = document.getElementById("caffeine-content");
    const volumeInput = document.getElementById("volume");
    const ctx = document.getElementById('caffeine-chart').getContext('2d');

    // Chart.js initial configuration
    let caffeineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
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
                    }
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
        const totalCaffeine = (caffeineContent * volume) / 240; // Assuming 240ml as standard serving

        logDrink(drinkName, volume, totalCaffeine);
        updateChart();
    });

    function logDrink(name, volume, caffeine) {
        const now = new Date();
        const drink = {
            name,
            volume,
            caffeine,
            time: now.getTime()
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
            const hoursSinceDrink = (now - drinkTime) / (1000 * 60 * 60); // Time difference in hours

            for (let i = Math.floor(hoursSinceDrink); i < hoursInDay; i++) {
                const hoursElapsed = i - hoursSinceDrink;
                const caffeineLeft = drink.caffeine * Math.pow(0.5, hoursElapsed / caffeineHalfLife);
                concentrations[i] += caffeineLeft;
            }
        });

        caffeineChart.data.datasets[0].data = concentrations;
        caffeineChart.update();
    }

    // Initialize chart with data
    updateChart();
});
