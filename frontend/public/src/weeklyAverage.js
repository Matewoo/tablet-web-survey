document.addEventListener('DOMContentLoaded', () => {
    const weeks = 52; // Number of weeks to fetch
    const allData = {};
    let completedRequests = 0;

    // Get dates for each week
    for (let i = 0; i < weeks; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7)); // Go back i weeks
        const monday = new Date(date);
        monday.setDate(monday.getDate() - monday.getDay() + 1); // Adjust to Monday
        const weekString = monday.toISOString().split('T')[0];

        // Fetch data for each week
        fetch(`/weekly-summary?week=${weekString}`)
            .then(response => response.json())
            .then(weekData => {
                if (Object.keys(weekData).length > 0) { // Only store if we have data
                    allData[weekString] = weekData;
                }
                completedRequests++;

                // Once all requests are complete, create the chart
                if (completedRequests === weeks) {
                    createChart(allData);
                }
            })
            .catch(error => {
                console.error(`Error fetching week ${weekString}:`, error);
                completedRequests++;
                if (completedRequests === weeks) {
                    createChart(allData);
                }
            });
    }
});

function getWeekNumber(date) {
    // Create a copy of the date to avoid modifying the original
    const target = new Date(date.valueOf());
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    // Get first Thursday in January
    const firstThursday = new Date(target.getFullYear(), 0, 1);
    if (firstThursday.getDay() !== 4) {
        firstThursday.setMonth(0, 1 + ((4 - firstThursday.getDay()) + 7) % 7);
    }
    // Calculate week number: Number of weeks between target and first Thursday
    const weekNr = 1 + Math.ceil((target - firstThursday) / (7 * 24 * 60 * 60 * 1000));
    return weekNr;
}


function createChart(data) {
    const categories = ['Fleischgericht', 'Vegetarisch', 'Tagesgericht', 'Tagessalat'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Sort weeks chronologically
    const sortedWeeks = Object.keys(data).sort();
    
    // Generate labels
    const labels = sortedWeeks.map(weekStart => {
        const date = new Date(weekStart);
        return `KW ${getWeekNumber(date)}`;
    });

    // Prepare datasets
    const datasets = categories.map(category => ({
        label: category,
        data: sortedWeeks.map(week => {
            const weekData = data[week];
            if (!weekData) return null;
            
            // Calculate weekly average
            const validRatings = days
                .map(day => {
                    const rating = weekData[day]?.[category]?.average;
                    return rating === 'N/A' ? null : Number(rating);
                })
                .filter(rating => rating !== null && !isNaN(rating));
            
            if (validRatings.length === 0) return null;
            return parseFloat((validRatings.reduce((a, b) => a + b) / validRatings.length).toFixed(2));
        }),
        fill: false,
        tension: 0.3,
        borderWidth: 2,
        spanGaps: true // Connect lines across null values
    }));

    // Debug output
    console.log('Chart Data:', {
        weeks: sortedWeeks,
        labels: labels,
        datasets: datasets.map(ds => ({
            label: ds.label,
            data: ds.data
        }))
    });

    // Set colors
    datasets[0].borderColor = '#FF6384'; // Meat/Fish - Red
    datasets[1].borderColor = '#36A2EB'; // Vegetarian - Blue
    datasets[2].borderColor = '#FFCE56'; // Daily Dish - Yellow
    datasets[3].borderColor = '#4BC0C0'; // Daily Salad - Green

    // Create chart
    const ctx = document.getElementById('weeklyAverageChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    color: 'black',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    labels: {
                        color: 'black'
                    }
                }
            }
        }
    });
}