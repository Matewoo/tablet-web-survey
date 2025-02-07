document.querySelectorAll('.emoji').forEach(button => {
  button.addEventListener('click', () => {
    const category = button.getAttribute('data-category');
    const results = {};
    results[category] = button.id;

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
      document.getElementById('content').style.visibility = 'hidden';
      setTimeout(() => {
        document.getElementById('thank-you-message').style.display = 'none';
        document.getElementById('content').style.visibility = 'visible';
        document.querySelectorAll('.emoji').forEach(button => button.classList.remove('selected'));
      }, 2500);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  });
});
