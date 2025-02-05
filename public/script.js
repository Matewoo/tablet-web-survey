document.querySelectorAll('.emoji').forEach(button => {
  button.addEventListener('click', () => {
    const category = button.getAttribute('data-category');
    if (category === 'Fleischgericht' || category === 'Vegetarisch' || category === 'Tagesgericht' || category === 'Tagessalat') {
      document.querySelectorAll('.emoji[data-category="Fleischgericht"], .emoji[data-category="Vegetarisch"], .emoji[data-category="Tagesgericht"], .emoji[data-category="Tagessalat"]').forEach(btn => btn.classList.remove('selected'));
    } else {
      document.querySelectorAll(`.emoji[data-category="${category}"]`).forEach(btn => btn.classList.remove('selected'));
    }
    button.classList.add('selected');
  });
});

document.getElementById('submit').addEventListener('click', () => {
  const results = {};
  document.querySelectorAll('.emoji.selected').forEach(button => {
    const category = button.getAttribute('data-category');
    results[category] = button.id;
  });

  if (Object.keys(results).length > 0) {
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
  }

  const submitButton = document.getElementById('submit');
  submitButton.disabled = true;
  setTimeout(() => {
    submitButton.disabled = false;
  }, 1000);
});