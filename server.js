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
    {id: 'date', title: 'DATE'},
    {id: 'category', title: 'CATEGORY'},
    {id: 'rating', title: 'RATING'}
  ],
  append: true
});

// Serve the client-side HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission
app.post('/submit', (req, res) => {
  const date = new Date().toISOString().split('T')[0]; // Aktuelles Datum
  const results = req.body;

  // Ergebnisse in die CSV-Datei einfügen
  const records = Object.keys(results).map(category => ({
    date,
    category,
    rating: results[category]
  }));

  csvWriter.writeRecords(records)
    .then(() => {
      console.log('Received feedback:', results);
      res.json({ status: 'success' });
    })
    .catch(error => {
      console.error('Error writing to CSV:', error);
      res.status(500).json({ status: 'error', message: 'Error writing to CSV' });
    });
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
    <body>
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
      <h1>Weekly Summary</h1>
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
        fetch('/weekly-summary')
          .then(response => response.json())
          .then(data => {
            const tableBody = document.getElementById('summary-table').getElementsByTagName('tbody')[0];
            const categories = ['Fleischgericht', 'Vegetarisch', 'Tagesgericht', 'Service'];
            categories.forEach(category => {
              const tr = document.createElement('tr');
              tr.innerHTML = \`
                <td>\${category}</td>
                <td>\${data.Monday[category]}</td>
                <td>\${data.Tuesday[category]}</td>
                <td>\${data.Wednesday[category]}</td>
                <td>\${data.Thursday[category]}</td>
                <td>\${data.Friday[category]}</td>
              \`;
              tableBody.appendChild(tr);
            });
          })
          .catch(error => {
            console.error('Error fetching summary:', error);
          });
      </script>
    </body>
    </html>
  `);
});

// Serve the weekly summary data
app.get('/weekly-summary', (req, res) => {
  const csvFilePath = 'survey_results.csv';
  csv({
    noheader: true,
    headers: ['date', 'category', 'rating']
  })
    .fromFile(csvFilePath)
    .then((jsonObj) => {
      const summary = {
        Monday: { Fleischgericht: { total: 0, count: 0 }, Vegetarisch: { total: 0, count: 0 }, Tagesgericht: { total: 0, count: 0 }, Service: { total: 0, count: 0 } },
        Tuesday: { Fleischgericht: { total: 0, count: 0 }, Vegetarisch: { total: 0, count: 0 }, Tagesgericht: { total: 0, count: 0 }, Service: { total: 0, count: 0 } },
        Wednesday: { Fleischgericht: { total: 0, count: 0 }, Vegetarisch: { total: 0, count: 0 }, Tagesgericht: { total: 0, count: 0 }, Service: { total: 0, count: 0 } },
        Thursday: { Fleischgericht: { total: 0, count: 0 }, Vegetarisch: { total: 0, count: 0 }, Tagesgericht: { total: 0, count: 0 }, Service: { total: 0, count: 0 } },
        Friday: { Fleischgericht: { total: 0, count: 0 }, Vegetarisch: { total: 0, count: 0 }, Tagesgericht: { total: 0, count: 0 }, Service: { total: 0, count: 0 } }
      };

      const ratingValues = {
        veryBad: 1,
        bad: 2,
        neutral: 3,
        good: 4,
        veryGood: 5
      };

      const serviceRatingValues = {
        bad: 1,
        neutral: 2,
        good: 3
      };

      jsonObj.forEach(row => {
        const date = new Date(row.date);
        const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        if (summary[day]) {
          if (row.category === 'Service') {
            summary[day][row.category].total += serviceRatingValues[row.rating];
          } else {
            summary[day][row.category].total += ratingValues[row.rating];
          }
          summary[day][row.category].count += 1;
        }
      });

      Object.keys(summary).forEach(day => {
        Object.keys(summary[day]).forEach(category => {
          if (summary[day][category].count > 0) {
            summary[day][category] = (summary[day][category].total / summary[day][category].count).toFixed(2);
          } else {
            summary[day][category] = 'N/A';
          }
        });
      });

      res.json(summary);
    })
    .catch((error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({ status: 'error', message: 'Error reading CSV' });
    });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});