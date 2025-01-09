const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');

// Create an Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Serve the client-side HTML
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Emoji Feedback</title>
      <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" type="text/css" href="style.css">
    </head>
    <body>
      <h1>Bitte bewerten Sie Ihren heutigen Aufenthalt</h1>
      <div class="content">
        <div>
          <div class="rating-container" style="justify-content:left;">
            <h3>Fleischgericht</h3>
          </div>
          <div class="rating-container" style="justify-content:left;">
            <h3>Vegetarisch</h3>
          </div>
          <div class="rating-container" style="justify-content:left;">
            <h3>Tagesgericht</h3>
          </div>
          <div class="rating-container" style="justify-content:left; margin-top: 20px; margin-bottom: 20px;">
            <h3>Service</h3>
          </div>
        </div>
        <div>
          <div class="rating-container">
            <div class="emojies">
              <button class="emoji" data-category="Fleischgericht" id="veryBad">😢</button>
              <button class="emoji" data-category="Fleischgericht" id="bad">😐</button>
              <button class="emoji" data-category="Fleischgericht" id="neutral">🙂</button>
              <button class="emoji" data-category="Fleischgericht" id="good">😋</button>
              <button class="emoji" data-category="Fleischgericht" id="veryGood">🤩</button>
            </div>
          </div>
          <div class="rating-container">
            <div class="emojies">
              <button class="emoji" data-category="Vegetarisch" id="veryBad">😢</button>
              <button class="emoji" data-category="Vegetarisch" id="bad">😐</button>
              <button class="emoji" data-category="Vegetarisch" id="neutral">🙂</button>
              <button class="emoji" data-category="Vegetarisch" id="good">😋</button>
              <button class="emoji" data-category="Vegetarisch" id="veryGood">🤩</button>
            </div>
          </div>
          <div class="rating-container">
            <div class="emojies">
              <button class="emoji" data-category="Tagesgericht" id="veryBad">😢</button>
              <button class="emoji" data-category="Tagesgericht" id="bad">😐</button>
              <button class="emoji" data-category="Tagesgericht" id="neutral">🙂</button>
              <button class="emoji" data-category="Tagesgericht" id="good">😋</button>
              <button class="emoji" data-category="Tagesgericht" id="veryGood">🤩</button>
            </div>
          </div>
          <div class="rating-container" style="margin-top: 20px; margin-bottom: 20px;">
            <div class="emojies">
              <button class="emoji" data-category="Service" id="bad">😟</button>
              <button class="emoji" data-category="Service" id="neutral">😐</button>
              <button class="emoji" data-category="Service" id="good">🙂</button>
            </div>
          </div>
        </div>
      </div>
      <button id="submit">Abschicken</button>
      <div id="thank-you-message" style="display: none; margin-top: 20px; font-size: 2rem;">Vielen Dank für Ihr Feedback!</div>

      <script>
        document.querySelectorAll('.emoji').forEach(button => {
          button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            document.querySelectorAll(\`.emoji[data-category="\${category}"]\`).forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
          });
        });

        document.getElementById('submit').addEventListener('click', () => {
          const results = {};
          document.querySelectorAll('.emoji.selected').forEach(button => {
            const category = button.getAttribute('data-category');
            results[category] = button.id;
          });

          fetch('/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(results)
          })
          .then(response => response.json())
          .then(data => {
            console.log('Success:', data);
            document.getElementById('thank-you-message').style.display = 'block';
            setTimeout(() => {
              document.getElementById('thank-you-message').style.display = 'none';
              document.querySelectorAll('.emoji').forEach(button => button.classList.remove('selected'));
            }, 1000);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
        });
      </script>
    </body>
    </html>
    `);
});

// Handle form submission
app.post('/submit', (req, res) => {
  console.log('Received feedback:', req.body);
  res.json({ status: 'success' });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});