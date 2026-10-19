/**
 * Ligament Site JavaScript
 * Strict Zero-Dependency & CSP-compliant (no eval, no innerHTML, pure textContent/classList)
 */
(function () {
  'use strict';

  // 0. Language: follow the browser/system language, with an explicit RU/EN override.
  function initLanguageRedirect() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const isEnglishPage = path === '/en' || path.endsWith('/en/index.html');
    const queryLanguage = new URLSearchParams(window.location.search).get('lang');
    const systemLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || 'ru';
    const language = queryLanguage || systemLanguage;
    const wantsEnglish = language.toLowerCase().startsWith('en');

    if (isEnglishPage === wantsEnglish) return;

    const target = new URL(wantsEnglish ? '/en/index.html' : '/index.html', window.location.origin);
    if (queryLanguage) target.searchParams.set('lang', wantsEnglish ? 'en' : 'ru');
    target.hash = window.location.hash;
    window.location.replace(target.href);
  }

  initLanguageRedirect();

  // 1. Theme Toggle: Default to DARK for signature enterprise cyber aesthetic
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Always default to 'dark' unless user explicitly saved 'light'
    const initialTheme = savedTheme === 'light' ? 'light' : 'dark';

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

  // 2. Interactive Scoped Tabs
  function initTabs() {
    const tabGroups = document.querySelectorAll('.tabs-group');
    if (!tabGroups.length) {
      const tabBtns = document.querySelectorAll('.tab-btn');
      const tabPanes = document.querySelectorAll('.tab-content');
      tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const targetId = btn.getAttribute('data-tab');
          tabBtns.forEach(function (b) { b.classList.remove('active'); });
          tabPanes.forEach(function (p) { p.classList.remove('active'); });
          btn.classList.add('active');
          const targetPane = document.getElementById(targetId);
          if (targetPane) targetPane.classList.add('active');
        });
      });
      return;
    }

    tabGroups.forEach(function (group) {
      const btns = group.querySelectorAll('.tab-btn');
      const panes = group.querySelectorAll('.tab-content');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const targetId = btn.getAttribute('data-tab');
          btns.forEach(function (b) { b.classList.remove('active'); });
          panes.forEach(function (p) { p.classList.remove('active'); });
          btn.classList.add('active');
          const target = group.querySelector('#' + targetId);
          if (target) target.classList.add('active');
        });
      });
    });
  }

  // 3. Modern Interactive Calculator
  function initCalculator() {
    const range = document.getElementById('calc-users-range');
    const valueBadge = document.getElementById('calc-users-val');
    const planSubBtn = document.getElementById('plan-sub');
    const planLifeBtn = document.getElementById('plan-life');
    const priceOutput = document.getElementById('calc-price-output');
    const subOutput = document.getElementById('calc-sub-output');
    const presetBtns = document.querySelectorAll('.preset-btn');

    if (!range || !priceOutput) return;

    const isEn = document.documentElement.lang === 'en';
    let activePlan = 'sub'; // 'sub' ($2/mo/user = $24/yr) or 'life' ($5/user one-time)

    function update() {
      const raw = parseInt(range.value, 10) || 5;
      const users = Math.min(10000, Math.max(5, raw));
      if (valueBadge) {
        valueBadge.textContent = users + (isEn ? ' users' : ' польз.');
      }

      if (users <= 5) {
        priceOutput.textContent = '$0';
        if (subOutput) {
          subOutput.textContent = isEn
            ? 'Free forever (up to 5 users, all features included)'
            : 'Бесплатно навсегда (до 5 пользователей, все функции)';
        }
        return;
      }

      if (activePlan === 'sub') {
        const totalYear = users * 2 * 12; // $2/user/mo * 12 mo
        priceOutput.textContent = '$' + totalYear.toLocaleString('en-US') + (isEn ? ' / yr' : ' / год');
        if (subOutput) {
          subOutput.textContent = isEn
            ? 'Equivalent to $' + (users * 2) + '/mo ($2 per user/month, billed annually)'
            : 'Равносильно $' + (users * 2) + ' в месяц ($2/пользователь, ежегодная оплата)';
        }
      } else {
        const totalLife = users * 5; // $5/user one-time
        priceOutput.textContent = '$' + totalLife.toLocaleString('en-US') + (isEn ? ' one-time' : ' разово');
        if (subOutput) {
          subOutput.textContent = isEn
            ? 'Perpetual lifetime license without recurring monthly fees ($5 per user)'
            : 'Бессрочная лицензия без регулярных платежей ($5/пользователь навсегда)';
        }
      }
    }

    range.addEventListener('input', update);

    presetBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const count = parseInt(btn.getAttribute('data-count'), 10);
        if (count) {
          range.value = count;
          update();
        }
      });
    });

    if (planSubBtn && planLifeBtn) {
      planSubBtn.addEventListener('click', function () {
        activePlan = 'sub';
        planSubBtn.classList.add('active');
        planLifeBtn.classList.remove('active');
        update();
      });
      planLifeBtn.addEventListener('click', function () {
        activePlan = 'life';
        planLifeBtn.classList.add('active');
        planSubBtn.classList.remove('active');
        update();
      });
    }

    update();
  }

  // 4. Copy-to-Clipboard
  function initClipboard() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;

      const text = btn.getAttribute('data-copy');
      if (!text) return;

      navigator.clipboard.writeText(text).then(function () {
        const originalText = btn.textContent;
        const isEn = document.documentElement.lang === 'en';
        const feedback = btn.getAttribute('data-copied-label') || (isEn ? '✓ Copied!' : '✓ Скопировано!');
        btn.textContent = feedback;
        btn.setAttribute('disabled', 'disabled');

        setTimeout(function () {
          btn.textContent = originalText;
          btn.removeAttribute('disabled');
        }, 2000);
      }).catch(function () {});
    });
  }

  // 5. Hero Interactive Mockup Demonstration (Clicking matching number unlocks desktop)
  function initMockup() {
    const matchOpts = document.querySelectorAll('.match-opt');
    const winStatus = document.getElementById('win-logon-status');
    const winSub = document.getElementById('win-logon-sub');
    const phonePushStatus = document.getElementById('phone-push-status');
    const isEn = document.documentElement.lang === 'en';

    if (!matchOpts.length || !winStatus) return;

    matchOpts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        const num = opt.getAttribute('data-match');
        matchOpts.forEach(function (o) { o.classList.remove('active'); });

        if (num === '42') {
          // Success
          opt.classList.add('active');
          winStatus.textContent = '';
          const dot = document.createElement('span');
          dot.className = 'pulse-dot';
          winStatus.appendChild(dot);
          winStatus.appendChild(document.createTextNode(' ' + (isEn ? 'Access Granted! Logging in...' : 'Доступ разрешен! Вход в систему...')));
          winStatus.style.color = '#34d399';
          if (winSub) {
            winSub.textContent = isEn ? '✓ Desktop unlocked in 0.4s' : '✓ Рабочий стол открыт за 0.4 сек';
            winSub.style.color = '#38bdf8';
          }
          if (phonePushStatus) {
            phonePushStatus.textContent = isEn ? '✓ Session Confirmed' : '✓ Вход подтвержден';
            phonePushStatus.style.color = '#34d399';
          }
        } else {
          // Mismatch
          winStatus.textContent = isEn ? '✕ Number Mismatch' : '✕ Неверное число';
          winStatus.style.color = '#f87171';
          if (winSub) {
            winSub.textContent = isEn ? 'Please tap number 42 on your phone' : 'Выберите число 42 на телефоне';
            winSub.style.color = '#94a3b8';
          }
        }
      });
    });
  }

  // 6. Interactive Zero-Trust Topology Network Graph
  function initGraph() {
    const scenarioBtns = document.querySelectorAll('.graph-scenario-btn');
    const nodes = document.querySelectorAll('.graph-node-group');
    const lines = document.querySelectorAll('.flow-line');
    const infoTitle = document.getElementById('graph-info-title');
    const infoDesc = document.getElementById('graph-info-desc');
    const infoBadge = document.getElementById('graph-info-badge');
    const isEn = document.documentElement.lang === 'en';

    if (!scenarioBtns.length) return;

    const scenarios = {
      'all': {
        title_ru: 'Полный корпоративный периметр Ligament',
        title_en: 'Full Corporate Security Perimeter Topology',
        desc_ru: 'Единый On-Premise контур: центральное ядро Core (SSO OpenID, политики, аудит), локальный вход Windows, RADIUS Wi-Fi/VPN и филиальный Relay (проброс RDP/SSH & бэкап Wi-Fi).',
        desc_en: 'Unified On-Premise mesh: central Core (SSO OpenID, policies, audit), Windows logon, RADIUS Wi-Fi/VPN, and branch Relay (RDP/SSH tunnel & Wi-Fi backup).',
        badge_ru: 'Все узлы активны',
        badge_en: 'All Nodes Active',
        active_nodes: ['node-ad', 'node-core', 'node-win', 'node-vpn', 'node-sso', 'node-relay', 'node-branch-lan', 'node-push', 'node-bot', 'node-yubi'],
        active_lines: ['line-ad', 'line-win', 'line-vpn', 'line-sso', 'line-relay', 'line-relay-lan', 'line-relay-vpn', 'line-push', 'line-bot', 'line-yubi']
      },
      'windows': {
        title_ru: 'Сценарий: Windows Auto-Logon & UAC',
        title_en: 'Scenario: Windows Auto-Logon & UAC',
        desc_ru: 'Нативная плитка LogonUI на Windows 10/11 отправляет Number Matching на телефон. При подтверждении — локальный вход за 0.4 сек без клика мышью.',
        desc_en: 'LogonUI tile sends Number Matching to smartphone. Approval yields instant 0.4s local desktop unlock without mouse click.',
        badge_ru: '0.4 сек вход • Локальный Logon & UAC',
        badge_en: '0.4s Unlock • Local Logon & UAC',
        active_nodes: ['node-win', 'node-core', 'node-push'],
        active_lines: ['line-win', 'line-push']
      },
      'vpn': {
        title_ru: 'Сценарий: RADIUS VPN & Офисный Wi-Fi',
        title_en: 'Scenario: RADIUS VPN & Office Wi-Fi',
        desc_ru: 'MikroTik, Cisco, Fortinet отправляют RADIUS-запрос. Сервер Core удерживает сессию (Push Holding по RFC 5080) до подтверждения на смартфоне.',
        desc_en: 'MikroTik, Cisco, Fortinet send RADIUS requests. Core server holds UDP session (RFC 5080) until push confirmation.',
        badge_ru: 'WPA2/WPA3 Enterprise • RFC 5080',
        badge_en: 'WPA2/WPA3 Enterprise • RFC 5080',
        active_nodes: ['node-vpn', 'node-core', 'node-push', 'node-bot'],
        active_lines: ['line-vpn', 'line-push', 'line-bot']
      },
      'relay': {
        title_ru: 'Сценарий: Филиал — Проброс RDP/SSH & Резерв Wi-Fi',
        title_en: 'Scenario: Branch — RDP/SSH Tunnel & Wi-Fi Backup',
        desc_ru: 'Relay обеспечивает проброс RDP (3389) и SSH (22) к внутренним хостам филиала по туннелю WSS :443 (без белого IP и без открытия портов) и бэкапит RADIUS для Wi-Fi при обрыве WAN.',
        desc_en: 'Relay tunnels RDP (3389) & SSH (22) to internal branch servers via outbound WSS :443 (no public IP, zero open ports) and backs up RADIUS Wi-Fi on WAN cuts.',
        badge_ru: 'Проброс RDP/SSH • Бэкап RADIUS Wi-Fi',
        badge_en: 'RDP/SSH Tunnel • Wi-Fi RADIUS Backup',
        active_nodes: ['node-core', 'node-relay', 'node-branch-lan', 'node-vpn', 'node-push'],
        active_lines: ['line-relay', 'line-relay-lan', 'line-relay-vpn', 'line-push']
      },
      'sso': {
        title_ru: 'Сценарий: Web SSO (OpenID Connect & SAML 2.0)',
        title_en: 'Scenario: Web SSO (OpenID Connect & SAML 2.0)',
        desc_ru: 'Единый вход Web SSO (OIDC / SAML) работает строго через Ligament Core: корпоративные сервисы, GitLab, 1С защищены централизованным MFA.',
        desc_en: 'Unified web SSO (OIDC / SAML) operates strictly through Ligament Core: corporate apps, GitLab, 1C are protected with central MFA.',
        badge_ru: 'OIDC / SAML • Строго через Core',
        badge_en: 'OIDC / SAML • Core Only',
        active_nodes: ['node-sso', 'node-core', 'node-push', 'node-bot'],
        active_lines: ['line-sso', 'line-push', 'line-bot']
      }
    };

    function applyScenario(scKey) {
      const data = scenarios[scKey] || scenarios['all'];
      if (infoTitle) infoTitle.textContent = isEn ? data.title_en : data.title_ru;
      if (infoDesc) infoDesc.textContent = isEn ? data.desc_en : data.desc_ru;
      if (infoBadge) infoBadge.textContent = isEn ? data.badge_en : data.badge_ru;

      nodes.forEach(function (n) {
        const id = n.getAttribute('id');
        if (data.active_nodes.indexOf(id) !== -1) {
          n.classList.remove('dimmed');
          n.classList.add('highlighted');
        } else {
          n.classList.add('dimmed');
          n.classList.remove('highlighted');
        }
      });

      lines.forEach(function (l) {
        const id = l.getAttribute('id');
        if (data.active_lines.indexOf(id) !== -1) {
          l.classList.remove('inactive');
        } else {
          l.classList.add('inactive');
        }
      });
    }

    scenarioBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        scenarioBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        const sc = btn.getAttribute('data-scenario');
        applyScenario(sc);
      });
    });

    // Node click
    nodes.forEach(function (n) {
      n.addEventListener('click', function () {
        const descRu = n.getAttribute('data-desc-ru');
        const descEn = n.getAttribute('data-desc-en');
        const titleRu = n.getAttribute('data-title-ru');
        const titleEn = n.getAttribute('data-title-en');
        const badgeRu = n.getAttribute('data-badge-ru');
        const badgeEn = n.getAttribute('data-badge-en');

        if (titleRu && infoTitle) infoTitle.textContent = isEn ? titleEn : titleRu;
        if (descRu && infoDesc) infoDesc.textContent = isEn ? descEn : descRu;
        if (badgeRu && infoBadge) infoBadge.textContent = isEn ? badgeEn : badgeRu;

        nodes.forEach(function (x) { x.classList.remove('highlighted'); });
        n.classList.add('highlighted');
      });
    });
  }

  // 7. Robust Smooth Nav Scroll & Active ScrollSpy
  function initNav() {
    const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');

    function scrollToHash(hash) {
      if (!hash || hash === '#') return;
      const id = hash.substring(1);
      if (!/^[a-zA-Z0-9_\-]+$/.test(id)) return;
      const target = document.getElementById(id);
      if (!target) return;

      const header = document.querySelector('.site-header');
      const headerOffset = header ? header.offsetHeight + 18 : 90;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }

    // Intercept clicks on internal anchors
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const hash = this.getAttribute('href');
        if (!hash || hash === '#') return;
        const id = hash.substring(1);
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          scrollToHash(hash);
          if (history.pushState) {
            history.pushState(null, null, hash);
          }
        }
      });
    });

    // Handle hash on initial load with slight delay to ensure layout is ready
    if (window.location.hash) {
      setTimeout(function () {
        scrollToHash(window.location.hash);
      }, 150);
    }

    // ScrollSpy to highlight active link in header
    if (navLinks.length && 'IntersectionObserver' in window) {
      const sectionMap = {};
      navLinks.forEach(function (link) {
        const id = link.getAttribute('href').substring(1);
        const sec = document.getElementById(id);
        if (sec) {
          sectionMap[id] = link;
        }
      });

      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (sectionMap[id]) {
              navLinks.forEach(function (l) { l.classList.remove('active'); });
              sectionMap[id].classList.add('active');
            }
          }
        });
      }, {
        rootMargin: '-15% 0px -70% 0px',
        threshold: 0
      });

      Object.keys(sectionMap).forEach(function (id) {
        const sec = document.getElementById(id);
        if (sec) observer.observe(sec);
      });
    }
  }

  // 8. Product screenshot slideshow
  function initScreenshots() {
    document.querySelectorAll('.screenshots-slideshow').forEach(function (show) {
      const slides = show.querySelectorAll('.screenshot-card');
      const controls = show.parentElement.querySelector('.slideshow-controls');
      if (!slides.length || !controls) return;

      const prev = controls.querySelector('[data-slide-prev]');
      const next = controls.querySelector('[data-slide-next]');
      const counter = controls.querySelector('[data-slide-counter]');
      let index = 0;

      function render() {
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === index);
        });
        if (counter) counter.textContent = (index + 1) + ' / ' + slides.length;
      }

      if (prev) prev.addEventListener('click', function () {
        index = (index - 1 + slides.length) % slides.length;
        render();
      });
      if (next) next.addEventListener('click', function () {
        index = (index + 1) % slides.length;
        render();
      });
      render();
    });
  }

  // Init all on load
  function initAll() {
    initTheme();
    initTabs();
    initCalculator();
    initClipboard();
    initMockup();
    initGraph();
    initNav();
    initScreenshots();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
