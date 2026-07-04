/* Medicentre — interactions. Everything degrades gracefully without JS. */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Loaded state → hero split-line reveal (state classes combine on <html>: .js.loaded) */
  window.addEventListener('load', function () {
    docEl.classList.add('loaded');
  });
  /* Safety: if load stalls (slow font), reveal anyway */
  setTimeout(function () { docEl.classList.add('loaded'); }, 2500);

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Scroll-spy for rail nav */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('[data-spy]'));
  var spyTargets = spyLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function setActive(id) {
    spyLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && spyTargets.length) {
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    spyTargets.forEach(function (t) { spyIO.observe(t); });
  }

  /* Footer year */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Form: consent gate, validation focus, async submit with honest fallback */
  var form = document.querySelector('.visit__form');
  if (form) {
    var statusEl = form.querySelector('.form__status');
    var fallbackEl = form.querySelector('.form__fallback');
    var submitBtn = form.querySelector('.btn--submit');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      statusEl.textContent = '';
      statusEl.className = 'form__status';

      /* validate */
      var firstInvalid = null;
      ['f-name', 'f-phone', 'f-msg', 'f-consent'].forEach(function (id) {
        var field = document.getElementById(id);
        var ok = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';
        field.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        statusEl.textContent = firstInvalid.id === 'f-consent'
          ? 'Please tick the consent box so we’re allowed to reply.'
          : 'Please fill in the highlighted field.';
        statusEl.classList.add('is-error');
        firstInvalid.focus();
        return;
      }

      /* honeypot */
      if (form.querySelector('.hp').value !== '') return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('send failed');
        form.reset();
        statusEl.textContent = 'Thanks — we’ll ring you back.';
        statusEl.classList.add('is-ok');
      }).catch(function () {
        fallbackEl.hidden = false;
        statusEl.textContent = '';
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message';
      });
    });
  }

  /* Magnetic call CTA (fine pointers only, respects reduced motion) */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var magnet = document.querySelector('[data-magnet]');
    if (magnet) {
      magnet.addEventListener('mousemove', function (ev) {
        var r = magnet.getBoundingClientRect();
        var x = (ev.clientX - r.left - r.width / 2) * 0.12;
        var y = (ev.clientY - r.top - r.height / 2) * 0.18;
        magnet.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      });
      magnet.addEventListener('mouseleave', function () {
        magnet.style.transform = '';
      });
    }
  }
})();
