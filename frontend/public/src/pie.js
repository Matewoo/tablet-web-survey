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
  
        const ctx = document.getElementById('feedbackChart-pie').getContext('2d');
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Sehr schlecht', 'Schlecht', 'Neutral', 'Gut', 'Sehr gut'],
            datasets: [{
              data: [ratings.veryBad, ratings.bad, ratings.neutral, ratings.good, ratings.veryGood],
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(54, 162, 235, 0.8)'
              ]
            }]
          }
        });
      });
  });