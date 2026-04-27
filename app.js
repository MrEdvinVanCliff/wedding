// Opens the invitation after the user taps the intro overlay.
function openInvitation() {
  const intro = document.getElementById('intro');
  const main = document.getElementById('main');

  if (!intro || intro.classList.contains('hide')) {
    return;
  }

  intro.classList.add('hide');
  main?.classList.add('visible');

  setTimeout(observeAll, 400);
}

// Reveals sections as they enter the viewport.
function observeAll() {
  const items = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .tl-item');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Number(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((item) => io.observe(item));
}

// Updates the thin progress line at the top of the page.
function updateProgressBar() {
  const progress = document.getElementById('progress');
  const max = document.body.scrollHeight - window.innerHeight;
  const percent = max > 0 ? (window.scrollY / max) * 100 : 0;

  if (progress) {
    progress.style.width = `${percent}%`;
  }
}

let wishIndex = 0;
const totalWishes = 2;

// Moves the wishes slider backward or forward.
function slideWish(dir) {
  wishIndex = (wishIndex + dir + totalWishes) % totalWishes;
  updateSlider();
}

// Jumps directly to the selected wish slide.
function goWish(i) {
  wishIndex = i;
  updateSlider();
}

// Applies the current slide position and dot state.
function updateSlider() {
  const track = document.getElementById('sliderTrack');
  if (track) {
    track.style.transform = `translateX(-${wishIndex * 100}%)`;
  }

  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === wishIndex);
  });
}

let attChoice = null;

// Stores the selected RSVP option and updates button styles.
function selectAtt(btn, val) {
  document.querySelectorAll('.att-btn').forEach((button) => button.classList.remove('selected'));
  btn.classList.add('selected');
  attChoice = val;
}

// Sends the RSVP form to the Vercel API and shows status to the guest.
async function submitForm() {
  const formWrap = document.getElementById('formWrap');
  const success = document.getElementById('formSuccess');
  const status = document.getElementById('formStatus');
  const submitButton = document.querySelector('.submit-btn');
  const surname = document.getElementById('fSurname')?.value.trim() || '';
  const name = document.getElementById('fName')?.value.trim() || '';
  const patronymic = document.getElementById('fPatronymic')?.value.trim() || '';
  const comment = document.getElementById('fComment')?.value.trim() || '';

  if (!formWrap || !success || !status || !submitButton) {
    return;
  }

  status.textContent = '';
  status.className = 'form-status';

  if (!surname || !name || !attChoice) {
    status.textContent = 'Заповніть прізвище, імʼя та оберіть варіант присутності.';
    status.classList.add('error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Надсилаємо...';

  try {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        surname,
        name,
        patronymic,
        attendance: attChoice,
        comment
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Не вдалося надіслати форму.');
    }

    status.textContent = result.message || 'Відповідь успішно надіслано.';
    status.classList.add('success');

    formWrap.style.opacity = '0';
    formWrap.style.transform = 'translateY(10px)';

    setTimeout(() => {
      formWrap.style.display = 'none';
      success.style.display = 'block';
      success.style.animation = 'fadeIn 0.8s ease forwards';
    }, 400);
  } catch (error) {
    status.textContent = error.message || 'Не вдалося відправити відповідь. Спробуйте ще раз.';
    status.classList.add('error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Надіслати відповідь';
  }
}

const target = new Date('2026-10-03T12:00:00');

// Updates the wedding countdown every second.
function updateCountdown() {
  const now = new Date();
  const diff = target - now;

  if (diff <= 0) {
    ['cdDays', 'cdHours', 'cdMinutes', 'cdSeconds'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = '00';
      }
    });
    return;
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');

  const secEl = document.getElementById('cdSeconds');
  secEl?.classList.remove('tick');
  void secEl?.offsetWidth;
  secEl?.classList.add('tick');

  const days = document.getElementById('cdDays');
  const hours = document.getElementById('cdHours');
  const minutes = document.getElementById('cdMinutes');
  const seconds = document.getElementById('cdSeconds');

  if (days) days.textContent = String(d);
  if (hours) hours.textContent = pad(h);
  if (minutes) minutes.textContent = pad(m);
  if (seconds) seconds.textContent = pad(s);
}

// Creates several particle families: glowing plankton, sparks and tiny galaxy clusters.
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  for (let i = 0; i < 56; i += 1) {
    const isSpark = Math.random() < 0.58;
    const isGalaxy = !isSpark && Math.random() < 0.28;
    const particle = document.createElement('div');
    const drift = () => `${(Math.random() - 0.5) * 22}px`;
    const left = `${Math.random() * 100}vw`;
    const duration = isSpark ? 10 + Math.random() * 12 : 14 + Math.random() * 16;
    const delay = Math.random() * 18;
    const sizeX = isSpark ? 2 + Math.random() * 5 : 10 + Math.random() * 10;
    const sizeY = isSpark ? 3 + Math.random() * 7 : sizeX * (1.45 + Math.random() * 0.55);
    const opacity = isSpark ? 0.38 + Math.random() * 0.32 : 0.24 + Math.random() * 0.22;
    const tilt = `${(Math.random() - 0.5) * 48}deg`;

    particle.className = `particle ${isSpark ? 'particle-spark' : 'particle-plankton'}${isGalaxy ? ' particle-galaxy' : ''}`;
    particle.style.left = left;
    particle.style.setProperty('--size-x', `${sizeX}px`);
    particle.style.setProperty('--size-y', `${sizeY}px`);
    particle.style.setProperty('--duration', `${duration}s`);
    particle.style.setProperty('--delay', `${delay}s`);
    particle.style.setProperty('--base-opacity', opacity.toFixed(2));
    particle.style.setProperty('--x-start', `${(Math.random() - 0.5) * 10}px`);
    particle.style.setProperty('--arc-a', `${(Math.random() - 0.5) * 34}px`);
    particle.style.setProperty('--arc-b', `${(Math.random() - 0.5) * 30}px`);
    particle.style.setProperty('--arc-c', `${(Math.random() - 0.5) * 46}px`);
    particle.style.setProperty('--arc-d', `${(Math.random() - 0.5) * 38}px`);
    particle.style.setProperty('--arc-e', `${(Math.random() - 0.5) * 52}px`);
    particle.style.setProperty('--arc-f', `${(Math.random() - 0.5) * 28}px`);
    particle.style.setProperty('--drift-a', drift());
    particle.style.setProperty('--drift-b', drift());
    particle.style.setProperty('--drift-c', drift());
    particle.style.setProperty('--drift-duration', `${2.4 + Math.random() * 4.2}s`);
    particle.style.setProperty('--spin-duration', `${2.8 + Math.random() * 3.6}s`);
    particle.style.setProperty('--twinkle-duration', `${1.8 + Math.random() * 2.8}s`);
    particle.style.setProperty('--twinkle-delay', `${Math.random() * 2.2}s`);
    particle.style.setProperty('--shake-duration', `${1.2 + Math.random() * 2.2}s`);
    particle.style.setProperty('--shake-delay', `${Math.random() * 1.6}s`);
    particle.style.setProperty('--trail-tilt', `${(Math.random() - 0.5) * 24}deg`);
    particle.style.setProperty('--tilt', tilt);
    if (isGalaxy) {
      particle.style.setProperty('--orbit-duration', `${2.8 + Math.random() * 2.4}s`);
    }

    const driftLayer = document.createElement('span');
    driftLayer.className = 'particle-drift';

    const spinLayer = document.createElement('span');
    spinLayer.className = 'particle-spin';

    const glow = document.createElement('span');
    glow.className = 'particle-glow';

    const core = document.createElement('span');
    core.className = 'particle-core';

    const trail = document.createElement('span');
    trail.className = 'particle-trail';

    spinLayer.appendChild(glow);
    spinLayer.appendChild(trail);
    spinLayer.appendChild(core);

    if (isGalaxy) {
      for (let n = 1; n <= 5; n += 1) {
        const satellite = document.createElement('span');
        satellite.className = `particle-satellite s${n}`;
        spinLayer.appendChild(satellite);
      }
    }

    driftLayer.appendChild(spinLayer);
    particle.appendChild(driftLayer);
    container.appendChild(particle);
  }
}

// Connects intro interactions for mouse, touch and keyboard.
function setupIntroTrigger() {
  const trigger = document.getElementById('introTrigger');
  if (!trigger) {
    return;
  }

  const handleOpen = (event) => {
    event.preventDefault();
    openInvitation();
  };

  trigger.addEventListener('click', handleOpen, { passive: false });
  trigger.addEventListener('touchend', handleOpen, { passive: false });
  trigger.addEventListener('pointerup', handleOpen, { passive: false });
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleOpen(event);
    }
  });
}

// Exposes UI actions for inline handlers used in the HTML.
function setupActions() {
  window.slideWish = slideWish;
  window.goWish = goWish;
  window.selectAtt = selectAtt;
  window.submitForm = submitForm;
}

// Bootstraps all front-end interactions once the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  document.getElementById('particles')?.classList.add('visible');
  setupIntroTrigger();
  setupActions();
  updateSlider();
  updateCountdown();
  updateProgressBar();

  window.addEventListener('scroll', updateProgressBar, { passive: true });
  window.addEventListener('resize', updateProgressBar);
  window.setInterval(updateCountdown, 1000);

  const styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }';
  document.head.appendChild(styleEl);
});
