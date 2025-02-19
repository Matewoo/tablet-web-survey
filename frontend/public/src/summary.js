let currentWeek = new Date();
currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Set to Monday of the current week

function updateWeekTitle() {
    const startOfWeek = new Date(currentWeek);
    const endOfWeek = new Date(currentWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday of the current week
    const weekNumber = Math.ceil(((startOfWeek - new Date(startOfWeek.getFullYear(), 0, 1)) / 86400000 + startOfWeek.getDay() + 1) / 7);
    document.getElementById('week-title').textContent = `KW${weekNumber} ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
}

function fetchSummary() {
    fetch(`/weekly-summary?week=${currentWeek.toISOString().split('T')[0]}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('summary-table').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            const categories = ['Fleischgericht', 'Vegetarisch', 'Tagesgericht', 'Tagessalat'];
            categories.forEach(category => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                  <td>${category}</td>
                  <td>${data.Monday[category].average} ⭐    (${data.Monday[category].count} P)</td>
                  <td>${data.Tuesday[category].average} ⭐    (${data.Tuesday[category].count} P)</td>
                  <td>${data.Wednesday[category].average} ⭐    (${data.Wednesday[category].count} P)</td>
                  <td>${data.Thursday[category].average} ⭐    (${data.Thursday[category].count} P)</td>
                  <td>${data.Friday[category].average} ⭐    (${data.Friday[category].count} P)</td>
                `;
                tableBody.appendChild(tr);
            });

            const tro = document.createElement('tr');
            tro.innerHTML = `
                <td>Gesamte Bewertungen</td>
                <td>${Number(data.Monday['Fleischgericht'].count) + Number(data.Monday['Vegetarisch'].count) + Number(data.Monday['Tagesgericht'].count) + Number(data.Monday['Tagessalat'].count)} Bewertungen</td>
                <td>${Number(data.Tuesday['Fleischgericht'].count) + Number(data.Tuesday['Vegetarisch'].count) + Number(data.Tuesday['Tagesgericht'].count) + Number(data.Tuesday['Tagessalat'].count)} Bewertungen</td>
                <td>${Number(data.Wednesday['Fleischgericht'].count) + Number(data.Wednesday['Vegetarisch'].count) + Number(data.Wednesday['Tagesgericht'].count) + Number(data.Wednesday['Tagessalat'].count)} Bewertungen</td>
                <td>${Number(data.Thursday['Fleischgericht'].count) + Number(data.Thursday['Vegetarisch'].count) + Number(data.Thursday['Tagesgericht'].count) + Number(data.Thursday['Tagessalat'].count)} Bewertungen</td>
                <td>${Number(data.Friday['Fleischgericht'].count) + Number(data.Friday['Vegetarisch'].count) + Number(data.Friday['Tagesgericht'].count) + Number(data.Friday['Tagessalat'].count)} Bewertungen</td>
              `;
            tableBody.appendChild(tro);

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