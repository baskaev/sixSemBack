let skip = 0;
const limit = 100;

async function loadData() {
  const res = await fetch(`/api/weather?skip=${skip}&limit=${limit}`);
  const data = await res.json();

  const recordsDiv = document.getElementById('records');
  recordsDiv.innerHTML = '';

  data.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.station_name}: ${item.temperature}°C at (${item.latitude}, ${item.longitude}) on ${item.timestamp}`;
    recordsDiv.appendChild(div);
  });
}

document.getElementById('weather-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    station_name: document.getElementById('station_name').value,
    temperature: parseFloat(document.getElementById('temperature').value),
    latitude: parseFloat(document.getElementById('latitude').value),
    longitude: parseFloat(document.getElementById('longitude').value),
  };

  await fetch('/api/weather/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  loadData();
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