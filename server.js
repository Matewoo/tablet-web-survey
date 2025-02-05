const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csvtojson');

// Create an Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// CSV Writer setup
const csvWriter = createCsvWriter({
  path: 'survey_results.csv',
  header: [
    { id: 'date', title: 'DATE' },
    { id: 'category', title: 'CATEGORY' },
    { id: 'rating', title: 'RATING' }
  ],
  append: true
});

// Serve the client-side HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission
app.post('/submit', (req, res) => {
  let date = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }).replace('"', '').replace(',', '');
  const results = req.body;

  // Ergebnisse in die CSV-Datei einfügen
  const records = Object.keys(results).map(category => ({
    date,
    category,
    rating: results[category]
  }));

  if (records.length > 0) {
    csvWriter.writeRecords(records)
      .then(() => {
        console.log('Received feedback:', results);
        res.json({ status: 'success' });
      })
      .catch(error => {
        console.error('Error writing to CSV:', error);
        res.status(500).json({ status: 'error', message: 'Error writing to CSV' });
      });
  }
});
  

// Serve the survey results page
app.get('/survey', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Survey Results</title>
      <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" type="text/css" href="style.css">
    </head>
    <body style="overflow-y: scroll;">
      <h1>Survey Results</h1>
      <div id="results"></div>
      <script>
        fetch('/results')
          .then(response => response.json())
          .then(data => {
            const resultsDiv = document.getElementById('results');
            data.forEach(row => {
              const div = document.createElement('div');
              div.textContent = \`Date: \${row.date}, Category: \${row.category}, Rating: \${row.rating}\`;
              resultsDiv.appendChild(div);
            });
          })
          .catch(error => {
            console.error('Error fetching results:', error);
          });
      </script>
    </body>
    </html>
  `);
});

// Serve the survey results data
app.get('/results', (req, res) => {
  const csvFilePath = 'survey_results.csv';
  csv({
    noheader: true,
    headers: ['date', 'category', 'rating']
  })
    .fromFile(csvFilePath)
    .then((jsonObj) => {
      res.json(jsonObj);
    })
    .catch((error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({ status: 'error', message: 'Error reading CSV' });
    });
});

// Serve the weekly summary page
app.get('/summary', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Summary</title>
      <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" type="text/css" href="style.css">
    </head>
    <body>
      <h1 id="week-title"></h1>
      <div>
        <button id="prev-week">&lt;</button>
        <button id="next-week">&gt;</button>
      </div>
      <table id="summary-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Monday</th>
            <th>Tuesday</th>
            <th>Wednesday</th>
            <th>Thursday</th>
            <th>Friday</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
      <script>
        let currentWeek = new Date();
        currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Set to Monday of the current week

        function updateWeekTitle() {
          const startOfWeek = new Date(currentWeek);
          const endOfWeek = new Date(currentWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday of the current week
          const weekNumber = Math.ceil(((startOfWeek - new Date(startOfWeek.getFullYear(), 0, 1)) / 86400000 + startOfWeek.getDay() + 1) / 7);
          document.getElementById('week-title').textContent = \`KW\${weekNumber} \${startOfWeek.toLocaleDateString()} - \${endOfWeek.toLocaleDateString()}\`;
        }

        function fetchSummary() {
          fetch(\`/weekly-summary?week=\${currentWeek.toISOString().split('T')[0]}\`)
            .then(response => response.json())
            .then(data => {
              const tableBody = document.getElementById('summary-table').getElementsByTagName('tbody')[0];
              tableBody.innerHTML = '';
              const categories = ['Fleischgericht', 'Vegetarisch', 'Tagesgericht', 'Tagessalat'];
              categories.forEach(category => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                  <td>\${category}</td>
                  <td>\${data.Monday[category].average} (\${data.Monday[category].count})</td>
                  <td>\${data.Tuesday[category].average} (\${data.Tuesday[category].count})</td>
                  <td>\${data.Wednesday[category].average} (\${data.Wednesday[category].count})</td>
                  <td>\${data.Thursday[category].average} (\${data.Thursday[category].count})</td>
                  <td>\${data.Friday[category].average} (\${data.Friday[category].count})</td>
                \`;
                tableBody.appendChild(tr);
              });
            })
            .catch(error => {
              console.error('Error fetching summary:', error);
            });
        }

        document.getElementById('prev-week').addEventListener('click', () => {
          currentWeek.setDate(currentWeek.getDate() - 7);
          updateWeekTitle();
          fetchSummary();
        });

        document.getElementById('next-week').addEventListener('click', () => {
          currentWeek.setDate(currentWeek.getDate() + 7);
          updateWeekTitle();
          fetchSummary();
        });

        updateWeekTitle();
        fetchSummary();
      </script>
    </body>
    </html>
  `);
});

// Serve the weekly summary data
app.get('/weekly-summary', (req, res) => {
  const week = req.query.week;
  if (!week) {
    return res.status(400).json({ status: 'error', message: 'Week query parameter is required! Example: domain.com/weekly-summary?week=2025-02-03' });
  }

  const [year, month, day] = week.split('-').map(Number);
  const weekStart = new Date(year, month - 1, day);
  
  if (isNaN(weekStart.getTime())) {
    return res.status(400).json({ status: 'error', message: 'Invalid date format' });
  }
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4); // Friday of the selected week

  const csvFilePath = 'survey_results.csv';
  csv({
    noheader: true,
    headers: ['date', 'category', 'rating']
  })
    .fromFile(csvFilePath)
    .then((jsonObj) => {
      const summary = {
        Monday: { Fleischgericht: [], Vegetarisch: [], Tagesgericht: [], Tagessalat: [] },
        Tuesday: { Fleischgericht: [], Vegetarisch: [], Tagesgericht: [], Tagessalat: [] },
        Wednesday: { Fleischgericht: [], Vegetarisch: [], Tagesgericht: [], Tagessalat: [] },
        Thursday: { Fleischgericht: [], Vegetarisch: [], Tagesgericht: [], Tagessalat: [] },
        Friday: { Fleischgericht: [], Vegetarisch: [], Tagesgericht: [], Tagessalat: [] }
      };

      const ratingValues = {
        veryBad: 1,
        bad: 2,
        neutral: 3,
        good: 4,
        veryGood: 5
      };

      jsonObj.forEach(row => {
        const [datePart, timePart] = row.date.split(' ');
        const [day, month, year] = datePart.split('.').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        const date = new Date(year, month - 1, day, hours, minutes, seconds);

        if (date >= weekStart && date <= weekEnd) {
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
          if (summary[dayName]) {
            summary[dayName][row.category].push(ratingValues[row.rating]);
          }
        }
      });

      // Calculate average ratings and count votes
      const averageSummary = {};
      Object.keys(summary).forEach(day => {
        averageSummary[day] = {};
        Object.keys(summary[day]).forEach(category => {
          const ratings = summary[day][category];
          const average = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 'N/A';
          const count = ratings.length;
          averageSummary[day][category] = { average, count };
        });
      });

      res.json(averageSummary);
    })
    .catch((error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({ status: 'error', message: 'Error reading CSV' });
    });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});