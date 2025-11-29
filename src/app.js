const state = {
  entries: [],
  searchIndex: null,
  entryMap: new Map(),
};

const elements = {
  searchInput: document.getElementById('searchInput'),
  channelSelect: document.getElementById('channelSelect'),
  startDate: document.getElementById('startDate'),
  endDate: document.getElementById('endDate'),
  resetFilters: document.getElementById('resetFilters'),
  quickFilters: document.getElementById('quickFilters'),
  results: document.getElementById('results'),
  statsChannel: document.getElementById('statsChannel'),
  statsStartDate: document.getElementById('statsStartDate'),
  statsEndDate: document.getElementById('statsEndDate'),
  chartCanvas: document.getElementById('metricsChart'),
};

let metricsChart;

document.addEventListener('DOMContentLoaded', () => {
  loadEntries();
  bindEvents();
});

async function loadEntries() {
  const response = await fetch('data/entries.json');
  const entries = await response.json();
  state.entries = entries;
  state.entryMap = new Map(entries.map((entry) => [entry.id, entry]));
  buildSearchIndex(entries);
  populateChannelSelects(entries);
  setDefaultDates();
  applyFilters();
  updateStats();
}

function bindEvents() {
  elements.searchInput.addEventListener('input', handleFiltersChange);
  elements.channelSelect.addEventListener('change', handleFiltersChange);
  elements.startDate.addEventListener('change', handleFiltersChange);
  elements.endDate.addEventListener('change', handleFiltersChange);
  elements.resetFilters.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.channelSelect.value = 'all';
    setDefaultDates();
    applyFilters();
    updateStats();
  });

  elements.quickFilters.addEventListener('click', (event) => {
    if (event.target.tagName !== 'BUTTON') return;
    const days = Number(event.target.dataset.range);
    setDateRange(days);
    applyFilters();
    updateStats();
  });

  elements.statsChannel.addEventListener('change', updateStats);
  elements.statsStartDate.addEventListener('change', updateStats);
  elements.statsEndDate.addEventListener('change', updateStats);
}

function buildSearchIndex(entries) {
  if (!window.miniLunr) {
    state.searchIndex = null;
    return;
  }

  const builder = window.miniLunr(function () {
    this.field('title');
    this.field('notes');
    this.ref('id');
  });

  entries.forEach((entry) => builder.add(entry));
  state.searchIndex = builder.search.bind(builder);
}

function populateChannelSelects(entries) {
  const channels = Array.from(new Set(entries.map((entry) => entry.channel))).sort();
  const options = ['<option value="all">Все каналы</option>', ...channels.map((c) => `<option value="${c}">${c}</option>`)];
  elements.channelSelect.innerHTML = options.join('');
  elements.statsChannel.innerHTML = options.join('');
}

function setDefaultDates() {
  if (!state.entries.length) return;
  const dates = state.entries.map((entry) => new Date(entry.date));
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  elements.startDate.value = toInputDate(min);
  elements.endDate.value = toInputDate(max);
  elements.statsStartDate.value = toInputDate(min);
  elements.statsEndDate.value = toInputDate(max);
}

function setDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  const startValue = toInputDate(start);
  const endValue = toInputDate(end);
  elements.startDate.value = startValue;
  elements.endDate.value = endValue;
  elements.statsStartDate.value = startValue;
  elements.statsEndDate.value = endValue;
}

function handleFiltersChange() {
  applyFilters();
  updateStats();
}

function applyFilters() {
  const query = elements.searchInput.value.trim();
  const channel = elements.channelSelect.value;
  const start = parseDate(elements.startDate.value);
  const end = parseDate(elements.endDate.value);

  let filtered = state.entries.filter((entry) => filterByChannel(entry, channel) && filterByDate(entry, start, end));
  filtered = applySearch(filtered, query);
  renderEntries(filtered);
}

function filterByChannel(entry, channel) {
  return channel === 'all' || entry.channel === channel;
}

function filterByDate(entry, start, end) {
  const entryDate = new Date(entry.date);
  const afterStart = !start || entryDate >= start;
  const beforeEnd = !end || entryDate <= end;
  return afterStart && beforeEnd;
}

function applySearch(entries, query) {
  if (!query) return entries;

  if (state.searchIndex) {
    const results = state.searchIndex(query);
    const ids = new Set(results.map((result) => result.ref));
    return entries.filter((entry) => ids.has(entry.id));
  }

  const lower = query.toLowerCase();
  return entries.filter((entry) => entry.title.toLowerCase().includes(lower) || entry.notes.toLowerCase().includes(lower));
}

function renderEntries(entries) {
  elements.results.innerHTML = '';

  if (!entries.length) {
    elements.results.innerHTML = '<p class="muted">Нет записей по выбранным условиям.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'card';

    const header = document.createElement('header');
    const title = document.createElement('h3');
    title.textContent = entry.title;
    const date = document.createElement('span');
    date.className = 'meta';
    date.textContent = new Date(entry.date).toLocaleDateString('ru-RU');
    header.append(title, date);

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `Канал: ${entry.channel}`;

    const notes = document.createElement('p');
    notes.textContent = entry.notes;

    const metrics = document.createElement('div');
    metrics.className = 'metrics';
    metrics.innerHTML = [
      `${entry.calories} ккал`,
      `${entry.distance} км`,
      `${entry.time} мин`
    ].join(' · ');

    card.append(header, meta, notes, metrics);
    fragment.appendChild(card);
  });

  elements.results.appendChild(fragment);
}

function parseDate(value) {
  return value ? new Date(value) : null;
}

function toInputDate(date) {
  const [year, month, day] = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((v, i) => (i === 0 ? String(v) : String(v).padStart(2, '0')));
  return `${year}-${month}-${day}`;
}

function updateStats() {
  const channel = elements.statsChannel.value;
  const start = parseDate(elements.statsStartDate.value);
  const end = parseDate(elements.statsEndDate.value);
  const filtered = state.entries.filter((entry) => filterByChannel(entry, channel) && filterByDate(entry, start, end));
  const grouped = groupByDate(filtered);
  drawChart(grouped);
}

function groupByDate(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const key = entry.date;
    if (!map.has(key)) {
      map.set(key, { calories: 0, distance: 0, time: 0 });
    }
    const current = map.get(key);
    current.calories += entry.calories;
    current.distance += entry.distance;
    current.time += entry.time;
  });

  const sorted = Array.from(map.entries())
    .map(([date, metrics]) => ({ date, ...metrics }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted;
}

function drawChart(data) {
  const labels = data.map((item) => item.date);
  const calories = data.map((item) => item.calories);
  const distance = data.map((item) => item.distance);
  const time = data.map((item) => item.time);

  const dataset = [
    { label: 'Калории', data: calories, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.25)' },
    { label: 'Дистанция (км)', data: distance, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.25)' },
    { label: 'Время (мин)', data: time, borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.25)' },
  ];

  if (metricsChart) {
    metricsChart.data.labels = labels;
    metricsChart.data.datasets.forEach((ds, index) => {
      ds.data = dataset[index].data;
    });
    metricsChart.update();
    return;
  }

  metricsChart = new Chart(elements.chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: dataset,
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: {
            color: '#cbd5e1',
          },
        },
        y: {
          ticks: {
            color: '#cbd5e1',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0',
          },
        },
      },
    },
  });
}
