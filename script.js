const body = document.documentElement;
const toggleButtons = [
  document.getElementById('theme-toggle'),
  document.getElementById('theme-toggle-mobile')
];

function setTheme(theme) {
  body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateTokens();
}

function updateTokens() {
  const bg = getComputedStyle(body).getPropertyValue('--color-bg').trim();
  const accent = getComputedStyle(body).getPropertyValue('--color-accent').trim();
  document.querySelectorAll('[data-token="bg"]').forEach((node) => {
    node.textContent = bg;
  });
  document.querySelectorAll('[data-token="accent"]').forEach((node) => {
    node.textContent = accent;
  });
}

function toggleTheme() {
  const current = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(current);
}

const storedTheme = localStorage.getItem('theme');
if (storedTheme) {
  setTheme(storedTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  setTheme('dark');
} else {
  setTheme('light');
}

toggleButtons.forEach((btn) => {
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
});

updateTokens();
