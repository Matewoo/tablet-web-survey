const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csvtojson');
const Database = require('better-sqlite3');

// Create an Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(bodyParser.json());

// CSV Writer setup
const csvFilePath = path.join(__dirname, '../../tablet-web-survey-data/data.csv');
const csvDir = path.dirname(csvFilePath);

// Ensure the directory exists
if (!fs.existsSync(csvDir)) {
  fs.mkdirSync(csvDir, { recursive: true });
}

// Ensure the file exists
if (!fs.existsSync(csvFilePath)) {
  fs.writeFileSync(csvFilePath, 'DATE,CATEGORY,RATING\n');
}

const dataDir = path.join(__dirname, '../../tablet-web-survey-data');

db = new Database(path.join(dataDir, 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      time TEXT,
      category VARCHAR(50),
      rating VARCHAR(20),

      CHECK (rating IN ('veryBad', 'bad', 'neutral', 'good', 'veryGood'))
  )
`);

const csvWriter = createCsvWriter({
  path: csvFilePath,
  header: [
    { id: 'date', title: 'DATE' },
    { id: 'category', title: 'CATEGORY' },
    { id: 'rating', title: 'RATING' }
  ],
  append: true
});

// Serve the client-side HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public', 'vote.html'));
});

app.get('/statistics', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public', 'statistics.html'));
});

// Handle form submission
app.post('/submit', (req, res) => {
  const now = new Date();
  const date = now.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
  const time = now.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin' });
  const results = req.body;

  try {
    // Prepare the insert statement
    const stmt = db.prepare('INSERT INTO feedback_entries (date, time, category, rating) VALUES (?, ?, ?, ?)');
    
    // Insert each category rating
    Object.keys(results).forEach(category => {
      stmt.run(date, time, category, results[category]);
    });

    console.log('Received feedback:', results);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error writing to database:', error);
    res.status(500).json({ status: 'error', message: 'Error writing to database' });
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
  const csvFilePath = path.join(__dirname, '../../tablet-web-survey-data/data.csv');
  
  // Get data from DB
  const dbResults = db.prepare(`
    SELECT 
      date || ' ' || time as date,
      category,
      rating
    FROM feedback_entries
  `).all();

  // Get data from CSV
  csv({
    noheader: true,
    headers: ['date', 'category', 'rating']
  })
    .fromFile(csvFilePath)
    .then((csvResults) => {
      // Combine both results
      const combinedResults = [...csvResults.slice(1), ...dbResults];
      res.json(combinedResults);
    })
    .catch((error) => {
      console.error('Error reading CSV:', error);
      // If CSV fails, return at least DB results
      res.json(dbResults);
    });
});

// Serve the weekly summary page
app.get('/summary', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public', 'summary.html'));
});

// Serve the weekly summary data
app.get('/weekly-summary', (req, res) => {
  const week = req.query.week;
  if (!week) {
    return res.status(400).json({ status: 'error', message: 'Week query parameter is required!' });
  }

  const [year, month, day] = week.split('-').map(Number);
  const weekStart = new Date(Date.UTC(year, month - 1, day));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 4);
  weekEnd.setUTCHours(23, 59, 59, 999);

  // Initialize summary structure
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

  // Get DB data
  const dbResults = db.prepare(`
    SELECT date, time, category, rating
    FROM feedback_entries
    WHERE date BETWEEN ? AND ?
  `).all(
    weekStart.toLocaleDateString('de-DE'),
    weekEnd.toLocaleDateString('de-DE')
  );

  // Process DB results
  dbResults.forEach(row => {
    const [day, month, year] = row.date.split('.').map(Number);
    const [hours, minutes, seconds] = row.time.split(':').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getUTCDay()];
    
    if (summary[dayName]) {
      summary[dayName][row.category].push(ratingValues[row.rating]);
    }
  });

  // Get CSV data
  csv({
    noheader: true,
    headers: ['date', 'category', 'rating']
  })
    .fromFile(path.join(__dirname, '../../tablet-web-survey-data/data.csv'))
    .then((csvResults) => {
      // Process CSV results
      csvResults.slice(1).forEach(row => {
        const [datePart, timePart] = row.date.split(' ');
        const [day, month, year] = datePart.split('.').map(Number);
        const [hours, minutes, seconds] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
        const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

        if (date >= weekStart && date <= weekEnd) {
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getUTCDay()];
          if (summary[dayName]) {
            summary[dayName][row.category].push(ratingValues[row.rating]);
          }
        }
      });

      // Calculate final averages combining both sources
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
      // If CSV fails, calculate averages from DB data only
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
    });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});