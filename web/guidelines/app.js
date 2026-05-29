// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-label');
const root = document.documentElement;

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    root.classList.toggle('light');
    if (root.classList.contains('light')) {
      themeLabel.textContent = 'Switch to Dark Mode';
      themeToggle.querySelector('i').classList.replace('ms-Icon--Lightbulb', 'ms-Icon--ClearNight');
    } else {
      themeLabel.textContent = 'Switch to Light Mode';
      themeToggle.querySelector('i').classList.replace('ms-Icon--ClearNight', 'ms-Icon--Lightbulb');
    }
  });
}

// Navigation (Progressive Disclosure)
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

function switchTab(targetId, updateUrl = true) {
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  // Remove active from all
  navLinks.forEach(l => l.classList.remove('active'));
  sections.forEach(s => s.classList.remove('active'));

  // Add active to the corresponding link
  const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Show section
  targetEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update URL silently
  if (updateUrl) {
    history.pushState(null, null, '#' + targetId);
  }
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(link.getAttribute('data-target'));
  });
});

// Sync on load
if (window.location.hash) {
  const hash = window.location.hash.substring(1);
  switchTab(hash, false);
}

// Range Slider custom fill logic
const ranges = document.querySelectorAll('.custom-range');
ranges.forEach(range => {
  const updateRange = () => {
    const min = parseFloat(range.min || 0);
    const max = parseFloat(range.max || 100);
    const val = (range.value - min) / (max - min) * 100;
    range.style.setProperty('--slider-val', `${val}%`);
  };
  range.addEventListener('input', updateRange);
  updateRange();
});
