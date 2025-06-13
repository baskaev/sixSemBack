let skip = 0;
const limit = 100;
let map;
let heatLayer;
let legend;

// Инициализация карты
function initMap() {
  map = L.map('map').setView([20, 0], 2);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Улучшенная легенда
  legend = L.control({position: 'bottomright'});
  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <h4>Temperature (°C)</h4>
      <div><i style="background: darkblue"></i> -30°C and below</div>
      <div><i style="background: blue"></i> -20°C</div>
      <div><i style="background: cyan"></i> -10°C</div>
      <div><i style="background: lime"></i> 0°C</div>
      <div><i style="background: yellow"></i> 10°C</div>
      <div><i style="background: orange"></i> 20°C</div>
      <div><i style="background: red"></i> 30°C and above</div>
    `;
    return div;
  };
  legend.addTo(map);
}

// Обновление тепловой карты
function updateHeatMap(data) {
  if (data.length === 0) return;

  const minTemp = -30;
  const maxTemp = 40;
  
  const heatData = data.map(item => {
    const intensity = Math.min(1, Math.max(0, (item.temperature - minTemp) / (maxTemp - minTemp)));
    return [item.latitude, item.longitude, intensity];
  });

  if (heatLayer) {
    map.removeLayer(heatLayer);
  }

  heatLayer = L.heatLayer(heatData, {
    radius: 25,
    blur: 15,
    maxZoom: 10,
    minOpacity: 0.5,
    gradient: {
      0.0: 'darkblue',
      0.2: 'blue',
      0.4: 'cyan',
      0.5: 'lime',
      0.7: 'yellow',
      0.8: 'orange',
      1.0: 'red'
    }
  }).addTo(map);

  // Автоматическое масштабирование
  const bounds = data.reduce((acc, item) => {
    return acc.extend([item.latitude, item.longitude]);
  }, L.latLngBounds([data[0].latitude, data[0].longitude], [data[0].latitude, data[0].longitude]));
  
  map.fitBounds(bounds, { padding: [50, 50] });
}

// Загрузка данных
async function loadData() {
  try {
    const res = await fetch(`/api/weather?skip=${skip}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load data');
    const data = await res.json();

    const recordsDiv = document.getElementById('records');
    recordsDiv.innerHTML = '';

    if (data.length === 0) {
      recordsDiv.innerHTML = '<div>No records found</div>';
      return;
    }

    data.forEach(item => {
      const div = document.createElement('div');
      const date = new Date(item.timestamp);
      div.innerHTML = `
        <strong>${item.station_name}</strong>: 
        ${item.temperature}°C at 
        (${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}) 
        on ${date.toLocaleString()}
      `;
      recordsDiv.appendChild(div);
    });

    updateHeatMap(data);
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
}

// Генерация тестовых данных
async function generateTestData() {
  try {
    const response = await fetch('/api/generate-test-data', {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to generate test data');
    
    const result = await response.json();
    alert(result.message);
    loadData();
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
}

// Обработчики событий
document.getElementById('weather-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const payload = {
      station_name: document.getElementById('station_name').value,
      temperature: parseFloat(document.getElementById('temperature').value),
      latitude: parseFloat(document.getElementById('latitude').value),
      longitude: parseFloat(document.getElementById('longitude').value),
    };

    const response = await fetch('/api/weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to submit data');
    
    e.target.reset();
    loadData();
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (skip >= limit) {
    skip -= limit;
    loadData();
  }
});

document.getElementById('next').addEventListener('click', () => {
  skip += limit;
  loadData();
});

document.getElementById('generate-btn').addEventListener('click', generateTestData);

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadData();
});