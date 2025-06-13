let skip = 0;
const limit = 100;

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
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
}

async function generateTestData() {
  try {
    const response = await fetch('/api/generate-test-data', {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to generate test data');
    
    const result = await response.json();
    alert(result.message);
    loadData(); // Refresh data after generation
  } catch (error) {
    console.error('Error:', error);
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

loadData();