document.addEventListener('DOMContentLoaded', () => {
    // Get last week's Monday date
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - today.getDay() - 6); // Go back to last Monday
    const weekString = lastWeek.toISOString().split('T')[0];

    // Fetch data from weekly-summary API
    fetch(`/weekly-summary?week=${weekString}`)
        .then(response => response.json())
        .then(data => {
            // Sum up all votes across all categories and days
            const totalVotes = Object.values(data).reduce((daySum, day) => {
                return daySum + Object.values(day).reduce((categorySum, category) => {
                    return categorySum + (category.count || 0);
                }, 0);
            }, 0);

            // Update the display
            document.querySelector('.feedbackValue-countAllLastWeek').textContent = totalVotes;
        })
        .catch(error => {
            console.error('Error fetching last week\'s count:', error);
            document.querySelector('.feedbackValue-countAllLastWeek').textContent = 'Fehler';
        });
});