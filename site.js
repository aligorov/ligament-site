/**
 * Ligament Site JavaScript
 * Strict Zero-Dependency & CSP-compliant:
 * - No innerHTML, no eval, no new Function
 * - No external network requests (connect-src 'none')
 * - Event delegation, pure textContent rendering
 */

(function () {
  'use strict';

  // 1. Theme Toggle & Preference
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }
  }

  // 2. Copy to Clipboard
  function initClipboard() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;

      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(function () {
        const originalText = btn.textContent;
        const feedback = btn.getAttribute('data-copied-label') || 'OK!';
        btn.textContent = feedback;
        btn.setAttribute('disabled', 'disabled');

        setTimeout(function () {
          btn.textContent = originalText;
          btn.removeAttribute('disabled');
        }, 2000);
      }).catch(function () {
        // Fallback or ignore
      });
    });
  }

  // 3. Pricing Calculator
  function initCalculator() {
    const usersInput = document.getElementById('calc-users');
    const relaysInput = document.getElementById('calc-relays');
    const planSelect = document.getElementById('calc-plan');
    const totalOutput = document.getElementById('calc-total');
    const formulaOutput = document.getElementById('calc-formula');

    if (!usersInput || !relaysInput || !planSelect || !totalOutput) return;

    function calculate() {
      const users = Math.max(0, parseInt(usersInput.value, 10) || 0);
      const relays = Math.max(0, parseInt(relaysInput.value, 10) || 0);
      const plan = planSelect.value; // 'sub3', 'sub6', 'sub13', 'perpetual'

      let total = 0;
      let formulaText = '';

      if (plan === 'perpetual') {
        // $5 per user + $1000 per relay
        const usersCost = users * 5;
        const relaysCost = relays * 1000;
        total = usersCost + relaysCost;
        formulaText = users + ' users × $5 + ' + relays + ' relays × $1,000 = ' + total.toLocaleString('en-US') + ' USDT';
      } else {
        // Subscription $2/user/month + $400/relay/period
        let months = 3;
        if (plan === 'sub6') months = 6;
        if (plan === 'sub13') months = 13;

        const usersCost = 2 * users * months;
        const relaysCost = 400 * relays;
        total = usersCost + relaysCost;
        formulaText = '2 × ' + users + ' users × ' + months + ' mo + ' + relays + ' relays × $400 = ' + total.toLocaleString('en-US') + ' USDT';
      }

      totalOutput.textContent = total.toLocaleString('en-US') + ' USDT';
      if (formulaOutput) {
        formulaOutput.textContent = formulaText;
      }
    }

    usersInput.addEventListener('input', calculate);
    relaysInput.addEventListener('input', calculate);
    planSelect.addEventListener('change', calculate);
    calculate();
  }

  // 4. Smooth Anchor Navigation with header offset
  function initNav() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href').substring(1);
        if (!targetId) return;
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
          if (history.pushState) {
            history.pushState(null, null, '#' + targetId);
          }
        }
      });
    });
  }

  // DOM Content Loaded initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initTheme();
      initClipboard();
      initCalculator();
      initNav();
    });
  } else {
    initTheme();
    initClipboard();
    initCalculator();
    initNav();
  }
})();
