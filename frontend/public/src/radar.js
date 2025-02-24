document.addEventListener('DOMContentLoaded', () => {
    fetch('/results')
      .then(response => response.json())
      .then(data => {
        const categories = ['Fleischgericht', 'Vegetarisch', 'Tagesgericht', 'Tagessalat'];
        const categoryAverages = {};
  
        // Berechne Durchschnittsbewertungen
        categories.forEach(category => {
          const ratings = data
            .filter(row => row.category === category)
            .map(row => {
              const scores = {veryBad: 1, bad: 2, neutral: 3, good: 4, veryGood: 5};
              return scores[row.rating];
            });
          categoryAverages[category] = ratings.length ? 
            ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        });
  
        const ctx = document.getElementById('feedbackChart-radar').getContext('2d');
        new Chart(ctx, {
          type: 'radar',
          data: {
            labels: categories,
            datasets: [{
              label: 'Durchschnittliche Bewertung',
              data: categories.map(c => categoryAverages[c]),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              pointBackgroundColor: 'rgba(75, 192, 192, 1)'
            }]
          },
          options: {
            scales: {
              r: {
                beginAtZero: true,
                max: 5
              }
            }
          }
        });
      });
  });