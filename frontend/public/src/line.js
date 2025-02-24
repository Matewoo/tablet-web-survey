document.addEventListener('DOMContentLoaded', () => {
    fetch('/results')
      .then(response => response.json())
      .then(data => {
        // Gruppiere Daten nach Datum
        const dateGroups = {};
        data.forEach(row => {
          const date = row.date.split(' ')[0];
          if (!dateGroups[date]) {
            dateGroups[date] = { good: 0, bad: 0 };
          }
          if (['good', 'veryGood'].includes(row.rating)) {
            dateGroups[date].good++;
          }
          if (['bad', 'veryBad'].includes(row.rating)) {
            dateGroups[date].bad++;
          }
        });
  
        const ctx = document.getElementById('feedbackChart-line').getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: Object.keys(dateGroups),
            datasets: [{
              label: 'Positive Bewertungen',
              data: Object.values(dateGroups).map(d => d.good),
              borderColor: 'rgba(75, 192, 192, 1)',
              tension: 0.1
            },
            {
              label: 'Negative Bewertungen',
              data: Object.values(dateGroups).map(d => d.bad),
              borderColor: 'rgba(255, 99, 132, 1)',
              tension: 0.1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      });
  });