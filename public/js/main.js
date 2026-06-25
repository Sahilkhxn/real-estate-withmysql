// ============================================
// MAIN.JS — Real Estate Listing Platform
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- Hamburger nav ----
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  // ---- Scroll to top ----
  const scrollBtn = document.querySelector('.scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ---- Flash message auto-dismiss ----
  const flashes = document.querySelectorAll('.flash');
  flashes.forEach(f => {
    setTimeout(() => f.style.opacity = '0', 3500);
    setTimeout(() => f.remove(), 4000);
  });

  // ---- Filter chips ----
  const chips = document.querySelectorAll('.filter-chip[data-filter]');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.dataset.group;
      if (group) {
        document.querySelectorAll(`.filter-chip[data-group="${group}"]`).forEach(c => c.classList.remove('active'));
      }
      chip.classList.toggle('active');
      applyFilters();
    });
  });

  // ---- Search form: price range validation ----
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      const minP = searchForm.querySelector('[name="minPrice"]');
      const maxP = searchForm.querySelector('[name="maxPrice"]');
      if (minP && maxP && minP.value && maxP.value) {
        if (Number(minP.value) > Number(maxP.value)) {
          e.preventDefault();
          alert('Minimum price cannot be greater than maximum price');
        }
      }
    });
  }

  // ---- Photo gallery (detail page) ----
  initGallery();

  // ---- Enquiry form ----
  initEnquiryForm();

  // ---- Number formatter ----
  formatPrices();

});

// Photo gallery
function initGallery() {
  const galleryMain = document.getElementById('galleryMain');
  if (!galleryMain) return;

  const thumbs = document.querySelectorAll('.gallery-thumbs img');
  const counter = document.querySelector('.gallery-counter');
  let currentIdx = 0;

  function setActive(idx) {
    currentIdx = idx;
    const src = thumbs[idx]?.dataset.full || thumbs[idx]?.src;
    if (src) galleryMain.src = src;
    thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
    if (counter) counter.textContent = `${idx + 1} / ${thumbs.length}`;
  }

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => setActive(i));
  });

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) prevBtn.addEventListener('click', () => setActive((currentIdx - 1 + thumbs.length) % thumbs.length));
  if (nextBtn) nextBtn.addEventListener('click', () => setActive((currentIdx + 1) % thumbs.length));

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && prevBtn) prevBtn.click();
    if (e.key === 'ArrowRight' && nextBtn) nextBtn.click();
  });

  if (thumbs.length > 0) setActive(0);
}

// Enquiry form AJAX
function initEnquiryForm() {
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const data = {
      name: form.querySelector('[name="name"]').value,
      phone: form.querySelector('[name="phone"]').value,
      email: form.querySelector('[name="email"]')?.value || '',
      message: form.querySelector('[name="message"]').value,
      propertyId: form.querySelector('[name="propertyId"]').value
    };

    try {
      const res = await fetch('/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        form.innerHTML = `<div class="flash flash-success">✓ Enquiry sent! We will contact you shortly.</div>`;
      } else {
        throw new Error(result.message || 'Failed');
      }
    } catch (err) {
      btn.textContent = original;
      btn.disabled = false;
      const errEl = form.querySelector('.form-error') || document.createElement('p');
      errEl.className = 'flash flash-error mt-16';
      errEl.textContent = 'Failed to send. Please try WhatsApp or call directly.';
      form.appendChild(errEl);
    }
  });
}

// Format prices in Indian format
function formatPrices() {
  document.querySelectorAll('[data-price]').forEach(el => {
    const price = Number(el.dataset.price);
    if (!isNaN(price)) {
      el.textContent = formatIndianPrice(price);
    }
  });
}

function formatIndianPrice(n) {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}

function applyFilters() {
  const active = Array.from(document.querySelectorAll('.filter-chip.active'));
  const typeFilter = active.find(c => c.dataset.group === 'type')?.dataset.filter;
  const catFilter = active.find(c => c.dataset.group === 'category')?.dataset.filter;

  const cards = document.querySelectorAll('.property-card');
  cards.forEach(card => {
    let show = true;
    if (typeFilter && card.dataset.type !== typeFilter) show = false;
    if (catFilter && card.dataset.category !== catFilter) show = false;
    card.style.display = show ? '' : 'none';
  });
}
