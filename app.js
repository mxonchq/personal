const storageKey = 'journalEntries';
const keyChannels = ['Здоровье', 'Финансы', 'Проекты'];
const logElement = document.getElementById('log');
const entriesElement = document.getElementById('entries');
const permissionStatus = document.getElementById('permissionStatus');
const channelSelect = document.getElementById('channel');
const entryDateInput = document.getElementById('entryDate');
const noteInput = document.getElementById('note');

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const today = new Date();
entryDateInput.value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

function appendLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  logElement.textContent = `[${timestamp}] ${message}\n${logElement.textContent}`;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    appendLog(`Ошибка чтения данных: ${error.message}`);
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
  renderEntries(entries);
}

function renderEntries(entries) {
  entriesElement.innerHTML = '';
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'entry';
    item.innerHTML = `
      <div><strong>${entry.channel}</strong> — ${entry.date}</div>
      <div>${entry.note || '—'}</div>
      <div class="muted">Обновлено: ${new Date(entry.updatedAt).toLocaleString()}</div>
    `;
    entriesElement.appendChild(item);
  });
}

function populateChannels() {
  keyChannels.forEach((channel) => {
    const option = document.createElement('option');
    option.value = channel;
    option.textContent = channel;
    channelSelect.appendChild(option);
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    appendLog('Service Worker недоступен.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('./service-worker.js');
    appendLog('Service Worker зарегистрирован.');
    return registration;
  } catch (error) {
    appendLog(`Ошибка регистрации Service Worker: ${error.message}`);
    return null;
  }
}

async function ensurePermission() {
  if (!('Notification' in window)) {
    appendLog('Уведомления не поддерживаются.');
    permissionStatus.textContent = 'не поддерживаются';
    return Notification.permission;
  }

  permissionStatus.textContent = Notification.permission;
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    permissionStatus.textContent = result;
    appendLog(`Разрешение: ${result}`);
    return result;
  }
  return Notification.permission;
}

async function showNotification(title, body) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    appendLog('Нет активного Service Worker.');
    return;
  }

  const permission = await ensurePermission();
  if (permission !== 'granted') {
    appendLog('Нет разрешения для уведомлений.');
    return;
  }

  await registration.showNotification(title, {
    body,
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><rect width="24" height="24" rx="6" fill="%232563eb"/><path d="M12 6a5 5 0 00-5 5v3.382l-.724 1.447A1 1 0 007.172 17h9.656a1 1 0 00.896-1.171L17 14.382V11a5 5 0 00-5-5zm0 13a2 2 0 01-2-2h4a2 2 0 01-2 2z" fill="white"/></svg>',
    badge: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1+jfqAAAAJElEQVR4AWOgEfz/nxlGJpAFMoElE5UGCoAEYBNhFCPmQEYAeNkA0QKAL0kCwpBi7/AAAAAElFTkSuQmCC',
  });
  appendLog(`Уведомление отправлено: ${title}`);
}

function upsertEntry(entries, newEntry) {
  const key = `${newEntry.channel}__${newEntry.date}`;
  const index = entries.findIndex((entry) => `${entry.channel}__${entry.date}` === key);

  if (index >= 0) {
    const shouldReplace = new Date(newEntry.updatedAt) > new Date(entries[index].updatedAt);
    if (shouldReplace) entries[index] = newEntry;
  } else {
    entries.push(newEntry);
  }
  return entries;
}

function handleSaveEntry() {
  const note = noteInput.value.trim();
  const date = entryDateInput.value;
  const channel = channelSelect.value;

  if (!date) {
    appendLog('Укажите дату.');
    return;
  }

  const entry = {
    id: crypto.randomUUID(),
    channel,
    date,
    note,
    updatedAt: new Date().toISOString(),
  };

  const entries = loadEntries();
  const updated = upsertEntry(entries, entry);
  saveEntries(updated);
  appendLog(`Сохранено для канала ${channel} на дату ${date}`);
  noteInput.value = '';
}

function hasEntryForTodayInKeyChannel(entries) {
  const todayStr = entryDateInput.value || new Date().toISOString().slice(0, 10);
  return entries.some(
    (entry) => entry.date === todayStr && keyChannels.includes(entry.channel),
  );
}

async function checkReminder() {
  const entries = loadEntries();
  if (!hasEntryForTodayInKeyChannel(entries)) {
    await showNotification('Нужна запись в ключевых каналах', 'Сегодня нет заметок. Добавьте новую.');
  } else {
    appendLog('Напоминание не требуется: запись уже есть.');
  }
}

function scheduleDailyReminder() {
  const now = new Date();
  const next = new Date();
  next.setHours(9, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  const initialDelay = next - now;
  appendLog(`Следующая проверка напоминаний через ${(initialDelay / (1000 * 60)).toFixed(0)} минут.`);

  setTimeout(() => {
    checkReminder();
    setInterval(checkReminder, 24 * 60 * 60 * 1000);
  }, initialDelay);
}

async function exportBackup() {
  const entries = loadEntries();
  const zip = new JSZip();
  const payload = {
    createdAt: new Date().toISOString(),
    entries,
  };

  zip.file('journal.json', JSON.stringify(payload, null, 2));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `journal-backup-${Date.now()}.zip`;
  link.click();
  URL.revokeObjectURL(url);
  appendLog('Резервная копия создана.');
}

async function importBackup(file) {
  try {
    const zip = new JSZip();
    const data = await zip.loadAsync(file);
    const jsonFile = data.file('journal.json');
    if (!jsonFile) {
      appendLog('В ZIP нет файла journal.json.');
      return;
    }
    const content = await jsonFile.async('string');
    const payload = JSON.parse(content);
    const incomingEntries = payload.entries || [];
    const existingEntries = loadEntries();

    const merged = incomingEntries.reduce((acc, entry) => upsertEntry(acc, entry), [...existingEntries]);
    saveEntries(merged);
    appendLog(`Импорт завершён. Добавлено/обновлено: ${merged.length - existingEntries.length} записей.`);
  } catch (error) {
    appendLog(`Ошибка импорта: ${error.message}`);
  }
}

function wireEvents() {
  document.getElementById('requestPermission').addEventListener('click', ensurePermission);
  document.getElementById('runReminder').addEventListener('click', checkReminder);
  document.getElementById('saveEntry').addEventListener('click', handleSaveEntry);
  document.getElementById('backup').addEventListener('click', exportBackup);
  document.getElementById('restore').addEventListener('click', () => document.getElementById('restoreInput').click());
  document.getElementById('restoreInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await importBackup(file);
    event.target.value = '';
  });
}

(async function init() {
  populateChannels();
  renderEntries(loadEntries());
  wireEvents();
  const registration = await registerServiceWorker();
  if (registration) scheduleDailyReminder();
  await ensurePermission();
})();
