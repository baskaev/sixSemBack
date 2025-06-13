let skip = 0;
const limit = 100;

async function loadData() {
  try {
    // Используем URL без слеша на конце
    const res = await fetch(`/api/weather?skip=${skip}&limit=${limit}`);
    if (!res.ok) throw new Error('Ошибка загрузки данных');
    const data = await res.json();

    const recordsDiv = document.getElementById('records');
    recordsDiv.innerHTML = '';

    data.forEach(item => {
      const div = document.createElement('div');
      const date = new Date(item.timestamp);
      div.textContent = `${item.station_name}: ${item.temperature}°C at (${item.latitude}, ${item.longitude}) on ${date.toLocaleString()}`;
      recordsDiv.appendChild(div);
    });
  } catch (error) {
    console.error('Ошибка:', error);
    alert(error.message);
  }
}

document.getElementById('weather-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const payload = {
      station_name: document.getElementById('station_name').value,
      temperature: parseFloat(document.getElementById('temperature').value),
      latitude: parseFloat(document.getElementById('latitude').value),
      longitude: parseFloat(document.getElementById('longitude').value),
    };

    // Используем URL без слеша на конце
    const response = await fetch('/api/weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Ошибка отправки данных');
    
    e.target.reset();
    loadData();
  } catch (error) {
    console.error('Ошибка:', error);
    alert(error.message);
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (skip >= limit) skip -= limit;
  loadData();
});

document.getElementById('next').addEventListener('click', () => {
  skip += limit;
  loadData();
});

loadData();