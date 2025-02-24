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
  
        const ctx = document.getElementById('feedbackChart-distributionOfAllRatings').getContext('2d');
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Sehr schlecht', 'Schlecht', 'Neutral', 'Gut', 'Sehr gut'],
            datasets: [{
              label: "Verteilung aller Bewertungen (N)",
              data: [ratings.veryBad, ratings.bad, ratings.neutral, ratings.good, ratings.veryGood],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(126, 126, 126, 0.5)'
                },
                ticks: {
                  color: 'rgba(0, 0, 0, 1)' // Farbe der y-Achsenbeschriftungen
                }
              },
              x: {
                grid: {
                  color: 'rgba(126, 126, 126, 0.5)'
                },
                ticks: {
                  color: 'rgba(0, 0, 0, 1)' // Farbe der x-Achsenbeschriftungen
                }
              }
            },
            plugins: {
              legend: {
                onClick: (e, legendItem, legend) => {
                  const dataset = chart.data.datasets[0];
                  if (dataset.label === "Verteilung aller Bewertungen (N)") {
                    dataset.data = dataset.data.map(value => (value / totalRatings * 100).toFixed(2));
                    dataset.label = "Verteilung aller Bewertungen (%)";
                  } else {
                    dataset.data = [ratings.veryBad, ratings.bad, ratings.neutral, ratings.good, ratings.veryGood];
                    dataset.label = "Verteilung aller Bewertungen (N)";
                  }
                  chart.update();
                }
              }
            }
          }
        });
      })
      .catch(error => {
        console.error('Error fetching results:', error);
      });
  });