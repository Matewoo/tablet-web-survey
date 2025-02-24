document.addEventListener('DOMContentLoaded', () => {
    fetch('/results')
        .then(response => response.json())
        .then(data => {
            const categories = ['Fleischgericht', 'Vegetarisch', 'Tagesgericht', 'Tagessalat'];
            const ratings = {
                veryBad: 0,
                bad: 0,
                neutral: 0,
                good: 0,
                veryGood: 0
            };

            data.forEach(row => {
                if (categories.includes(row.category)) {
                    ratings[row.rating]++;
                }
            });

            const totalRatings = Object.values(ratings).reduce((a, b) => a + b, 0);
            document.querySelector('.feedbackValue-countAllEver').textContent = totalRatings;
        })
        .catch(error => {
            console.error('Error fetching results:', error);
        });
});