document.addEventListener('DOMContentLoaded', () => {
    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const currentWeek = new Date(today);
    currentWeek.setDate(today.getDate() - today.getDay() + 1); // Set to Monday of current week
    
    // Format date for API request
    const weekString = currentWeek.toISOString().split('T')[0];

    // Get current day name
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[today.getDay()];

    // Fetch data from weekly-summary API
    fetch(`/weekly-summary?week=${weekString}`)
        .then(response => response.json())
        .then(data => {
            // Only process if we have data for today (Mon-Fri)
            if (currentDay in data) {
                // Update mini-stats boxes with today's averages
                document.getElementById('todaysAverageMeatFish').textContent = 
                    data[currentDay]['Fleischgericht'].average !== 'N/A' 
                        ? `${data[currentDay]['Fleischgericht'].average} ⭐` 
                        : 'Keine Daten';

                document.getElementById('todaysAverageVeggi').textContent = 
                    data[currentDay]['Vegetarisch'].average !== 'N/A' 
                        ? `${data[currentDay]['Vegetarisch'].average} ⭐` 
                        : 'Keine Daten';

                document.getElementById('todaysAverageDailyDish').textContent = 
                    data[currentDay]['Tagesgericht'].average !== 'N/A' 
                        ? `${data[currentDay]['Tagesgericht'].average} ⭐` 
                        : 'Keine Daten';

                document.getElementById('todaysAverageDailySalad').textContent = 
                    data[currentDay]['Tagessalat'].average !== 'N/A' 
                        ? `${data[currentDay]['Tagessalat'].average} ⭐` 
                        : 'Keine Daten';
            } else {
                // If it's weekend or no data available
                const elements = [
                    'todaysAverageMeatFish',
                    'todaysAverageVeggi',
                    'todaysAverageDailyDish',
                    'todaysAverageDailySalad'
                ];
                elements.forEach(id => {
                    document.getElementById(id).textContent = 'Keine Daten';
                });
            }
        })
        .catch(error => {
            console.error('Error fetching today\'s averages:', error);
            // Show error state in mini-stats boxes
            const elements = [
                'todaysAverageMeatFish',
                'todaysAverageVeggi',
                'todaysAverageDailyDish',
                'todaysAverageDailySalad'
            ];
            elements.forEach(id => {
                document.getElementById(id).textContent = 'Fehler';
            });
        });
});