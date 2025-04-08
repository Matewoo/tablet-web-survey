let currentWeek = new Date();
currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Set to Monday of the current week
let currentWeekNumber = getWeekNumber(currentWeek);
let currentYear = currentWeek.getFullYear();

function getWeekNumber(date) {
    // ISO-8601 Wochennummer berechnen
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function updateWeekTitle() {
    const startOfWeek = new Date(currentWeek);
    const endOfWeek = new Date(currentWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday of the current week
    
    document.getElementById('week-title').textContent = 
        `KW${currentWeekNumber}-${currentYear} ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
}

function fetchSummary() {
    const kwParam = `KW${currentWeekNumber}-${currentYear}`;
    
    fetch(`/api/weekSummary?kw=${kwParam}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('summary-table').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            const categories = ['Fleischgericht', 'Vegetarisch', 'Tagesgericht', 'Tagessalat'];
            
            categories.forEach(category => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                  <td>${category}</td>
                  <td>${data.data.Monday[category].average} ⭐    (${data.data.Monday[category].count} P)</td>
                  <td>${data.data.Tuesday[category].average} ⭐    (${data.data.Tuesday[category].count} P)</td>
                  <td>${data.data.Wednesday[category].average} ⭐    (${data.data.Wednesday[category].count} P)</td>
                  <td>${data.data.Thursday[category].average} ⭐    (${data.data.Thursday[category].count} P)</td>
                  <td>${data.data.Friday[category].average} ⭐    (${data.data.Friday[category].count} P)</td>
                `;
                tableBody.appendChild(tr);
            });

            const tro = document.createElement('tr');
            tro.innerHTML = `
                <td>Gesamte Bewertungen</td>
                <td>${Number(data.data.Monday['Fleischgericht'].count) + Number(data.data.Monday['Vegetarisch'].count) + Number(data.data.Monday['Tagesgericht'].count) + Number(data.data.Monday['Tagessalat'].count)} Bewertungen</td>
                <td>${Number(data.data.Tuesday['Fleischgericht'].count) + Number(data.data.Tuesday['Vegetarisch'].count) + Number(data.data.Tuesday['Tagesgericht'].count) + Number(data.data.Tuesday['Tagessalat'].count)} Bewertungen</td>
                <td>${Number(data.data.Wednesday['Fleischgericht'].count) + Number(data.data.Wednesday['Vegetarisch'].count) + Number(data.data.Wednesday['Tagesgericht'].count) + Number(data.data.Wednesday['Tagessalat'].count)} Bewertungen</td>
                <td>${Number(data.data.Thursday['Fleischgericht'].count) + Number(data.data.Thursday['Vegetarisch'].count) + Number(data.data.Thursday['Tagesgericht'].count) + Number(data.data.Thursday['Tagessalat'].count)} Bewertungen</td>
                <td>${Number(data.data.Friday['Fleischgericht'].count) + Number(data.data.Friday['Vegetarisch'].count) + Number(data.data.Friday['Tagesgericht'].count) + Number(data.data.Friday['Tagessalat'].count)} Bewertungen</td>
              `;
            tableBody.appendChild(tro);
        })
        .catch(error => {
            console.error('Error fetching summary:', error);
        });
}

document.getElementById('prev-week').addEventListener('click', () => {
    currentWeek.setDate(currentWeek.getDate() - 7);
    
    currentWeekNumber = getWeekNumber(currentWeek);
    currentYear = currentWeek.getFullYear();
    
    updateWeekTitle();
    fetchSummary();
});

document.getElementById('next-week').addEventListener('click', () => {
    currentWeek.setDate(currentWeek.getDate() + 7);
    
    currentWeekNumber = getWeekNumber(currentWeek);
    currentYear = currentWeek.getFullYear();
    
    updateWeekTitle();
    fetchSummary();
});

updateWeekTitle();
fetchSummary();