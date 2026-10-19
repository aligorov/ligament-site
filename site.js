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

    function updateBrandLogos(theme) {
      document.querySelectorAll('.brand-logo').forEach(function (logo) {
        const source = logo.getAttribute('data-logo-' + theme);
        if (source) logo.setAttribute('src', source);
      });
    }

    updateBrandLogos(initialTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateBrandLogos(newTheme);
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

  // 3. Localized license and module calculator.
  function initCalculator() {
    const range = document.getElementById('calc-users-range');
    const plan = document.getElementById('calc-plan');
    const output = document.getElementById('calc-price-output');
    if (!range || !plan || !output) return;

    const isEn = document.documentElement.lang === 'en';
    const scale = isEn ? 1 : 100;
    const money = function (amount) {
      return new Intl.NumberFormat(isEn ? 'en-US' : 'ru-RU', {
        style: 'currency', currency: isEn ? 'USD' : 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 2
      }).format(amount * scale);
    };
    const modules = document.querySelectorAll('[data-module-price]');
    const relay = document.getElementById('calc-relays');
    const support = document.getElementById('calc-support');
    const value = document.getElementById('calc-users-val');
    const detail = document.getElementById('calc-sub-output');
    const breakdown = document.getElementById('calc-breakdown');
    const renewal = document.getElementById('calc-renewal');
    const included = ['trust', 'sso', 'bastion'];
    const moduleSelections = new WeakMap();

    function update() {
      const users = Math.min(1000, Math.max(5, parseInt(range.value, 10) || 5));
      const free = users <= 5;
      const seats = free ? 0 : Math.max(20, users);
      const perpetual = plan.value === 'perpetual';
      const business = plan.value.startsWith('business-') && !free;
      const annual = plan.value.endsWith('-year');
      const rate = perpetual ? 15 : business ? 2.5 : 1;
      const userTotal = seats * rate * (annual ? 12 : 1);
      let moduleTotal = 0;
      modules.forEach(function (input) {
        const bundled = business && included.includes(input.getAttribute('data-module'));
        if (bundled && !moduleSelections.has(input)) {
          moduleSelections.set(input, input.checked);
          input.checked = true;
        } else if (!bundled && moduleSelections.has(input)) {
          input.checked = moduleSelections.get(input);
          moduleSelections.delete(input);
        }
        input.disabled = bundled;
        input.closest('label').classList.toggle('module-included', bundled);
        const label = input.closest('label').querySelector('.module-choice-text');
        if (label) {
          if (!label.dataset.normalLabel) label.dataset.normalLabel = label.textContent;
          label.textContent = bundled
            ? input.getAttribute('data-module').toUpperCase() + (isEn ? ' — included in Business' : ' — включён в Business')
            : label.dataset.normalLabel;
        }
        if (!bundled && input.checked) moduleTotal += Number(input.getAttribute('data-module-price')) || 0;
      });
      const relayCount = relay ? Math.min(1000, Math.max(0, Math.floor(Number(relay.value) || 0))) : 0;
      if (relay) relay.value = String(relayCount);
      moduleTotal += relayCount * 500;
      const supportTotal = support && support.checked ? 500 : 0;
      const total = userTotal + moduleTotal + supportTotal;
      const suffix = perpetual || free ? (isEn ? ' one-time' : ' разово') : annual ? (isEn ? ' for 13 months' : ' за 13 месяцев') : (isEn ? ' first payment' : ' первый платёж');
      output.textContent = (supportTotal ? (isEn ? 'from ' : 'от ') : '') + money(total) + suffix;
      if (value) value.textContent = users + (isEn ? ' users' : ' польз.');
      if (detail) detail.textContent = free
        ? (isEn ? 'Community: base features free for up to 5 users. Selected modules billed separately.' : 'Community: базовые функции бесплатно до 5 пользователей. Выбранные модули отдельно.')
        : seats + (isEn ? ' licenses; minimum 20. ' : ' лицензий; минимум 20. ') + (perpetual
          ? (isEn ? 'Base perpetual; first year of updates included.' : 'Base бессрочно; первый год обновлений включён.')
          : (business ? 'Business: Base + SSO + Trust + Bastion + ' + (isEn ? 'basic SIEM event forwarding. ' : 'базовая передача событий в SIEM. ') : 'Base: Windows Logon/UAC + RADIUS + Notify. ') + (annual ? (isEn ? '12 paid months + 1 month free.' : '12 месяцев оплаты + 1 месяц в подарок.') : (isEn ? 'Monthly billing; subscription updates included.' : 'Помесячная оплата; обновления подписки включены.')));
      if (breakdown) breakdown.textContent = (isEn ? 'User licenses: ' : 'Лицензии пользователей: ') + money(userTotal) + (isEn ? '; one-time modules and Relay: ' : '; модули и Relay разово: ') + money(moduleTotal) + (supportTotal ? (isEn ? '; Support for 1 year: from ' : '; Support на 1 год: от ') + money(supportTotal) : '');
      if (renewal) renewal.textContent = (perpetual || free ? '' : (isEn ? 'Recurring user subscription: ' : 'Продление пользовательской подписки: ') + money(userTotal) + (annual ? (isEn ? ' for 13 months. ' : ' за 13 месяцев. ') : (isEn ? '/month. ' : '/месяц. '))) + (isEn ? 'Optional updates for purchased perpetual licenses from year two: ' : 'Обновления приобретённых бессрочных лицензий со второго года, по желанию: ') + money((moduleTotal + (perpetual ? userTotal : 0)) * 0.2) + (isEn ? '/year.' : '/год.') + (supportTotal ? (isEn ? ' Support: from ' : ' Support: от ') + money(500) + (isEn ? '/year by agreement.' : '/год по договору.') : '');
    }

    range.addEventListener('input', update);
    plan.addEventListener('change', update);
    modules.forEach(function (input) { input.addEventListener('change', update); });
    if (relay) relay.addEventListener('input', update);
    if (support) support.addEventListener('change', update);
    document.querySelectorAll('.preset-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        range.value = button.getAttribute('data-count');
        update();
      });
    });
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

  // 6. Interactive topology: connection routes and a separate offline Wi-Fi path.
  function initGraph() {
    const viewport = document.querySelector('.graph-svg-container');
    if (!viewport) return;
    const buttons = document.querySelectorAll('.graph-scenario-btn');
    const nodes = Array.from(document.querySelectorAll('.graph-node-group'));
    const lines = Array.from(document.querySelectorAll('.flow-line'));
    const title = document.getElementById('graph-info-title');
    const description = document.getElementById('graph-info-desc');
    const badge = document.getElementById('graph-info-badge');
    const route = document.getElementById('graph-route');
    const isEn = document.documentElement.lang === 'en';
    const t = function (ru, en) { return isEn ? en : ru; };
    const scenarios = {
      all: {
        title: t('Полная топология', 'Full topology'),
        desc: t('Core обслуживает MFA, SSO и Bastion. Relay передаёт подключения в филиал и предоставляет отдельный резервный Wi-Fi RADIUS. Факторы справа являются альтернативами.', 'Core handles MFA, SSO and Bastion. Relay forwards branch connections and provides a separate backup Wi-Fi RADIUS. Factors on the right are alternatives.'),
        badge: t('Все связи • резерв отдельно', 'All connections • separate backup'),
        nodes: nodes.map(function (node) { return node.id; }),
        lines: lines.map(function (line) { return line.id; }),
        steps: [t('Входные сервисы', 'Ingress services'), 'Core + MFA', t('Приложения / хосты', 'Applications / hosts'), t('Relay: филиал / Wi-Fi резерв', 'Relay: branch / Wi-Fi backup')]
      },
      portal: {
        title: t('Внешний доступ к порталу с 2FA', 'External portal access with 2FA'),
        desc: t('Портал открывается извне по HTTPS. Доступ защищён 2FA. Приложение пользователя соединяется с Core по HTTPS/WSS для запросов и подтверждений; Relay в этом маршруте не участвует.', 'The portal is accessed externally over HTTPS and protected by 2FA. The user app connects to Core over HTTPS/WSS for requests and approvals; Relay is not part of this route.'),
        badge: 'HTTPS / WSS :443 • 2FA',
        nodes: ['node-portal', 'node-core', 'node-push'],
        lines: ['line-portal', 'line-push'],
        steps: [t('Браузер извне', 'External browser'), 'HTTPS / Core', t('2FA • приложение HTTPS/WSS', '2FA • app HTTPS/WSS'), t('Доступ к порталу', 'Portal access')]
      },
      windows: {
        title: 'Windows Logon / UAC',
        desc: t('Credential Provider на рабочей станции обращается к Core/AD. После подтверждения MFA выполняется локальный вход или повышение прав. Relay не участвует.', 'The workstation Credential Provider connects to Core/AD. MFA approval enables local logon or elevation. Relay is not involved.'),
        badge: t('Локальный вход • без Relay', 'Local logon • no Relay'),
        nodes: ['node-win', 'node-core', 'node-ad', 'node-push'],
        lines: ['line-win', 'line-ad', 'line-push'],
        steps: ['Credential Provider', 'Core / AD', 'Push MFA', t('Вход / UAC', 'Logon / UAC')]
      },
      vpn: {
        title: t('VPN / офисный Wi-Fi', 'VPN / office Wi-Fi'),
        desc: t('VPN-шлюз или точка доступа отправляет RADIUS-запрос в Core. Пользователь подтверждает MFA через Push либо бота. Relay не обслуживает этот центральный маршрут.', 'The VPN gateway or access point sends a RADIUS request to Core. The user approves MFA through Push or a bot. Relay does not handle this central route.'),
        badge: 'RADIUS • MFA',
        nodes: ['node-vpn', 'node-core', 'node-push', 'node-bot'],
        lines: ['line-vpn', 'line-push', 'line-bot'],
        steps: [t('VPN / точка доступа', 'VPN / access point'), 'Core RADIUS', t('Push или бот', 'Push or bot'), t('Доступ в сеть', 'Network access')]
      },
      sso: {
        title: 'Web SSO • OIDC / SAML',
        desc: t('Веб-приложение использует IdP Ligament Core и центральное подтверждение MFA. Relay не участвует в OIDC/SAML.', 'The web application uses the Ligament Core IdP and central MFA approval. Relay is not involved in OIDC/SAML.'),
        badge: t('Строго через Core', 'Core only'),
        nodes: ['node-sso', 'node-core', 'node-push', 'node-bot'],
        lines: ['line-sso', 'line-push', 'line-bot'],
        steps: [t('Веб-приложение', 'Web application'), 'Core IdP', t('Push или бот', 'Push or bot'), t('SSO-сессия', 'SSO session')]
      },
      bastion: {
        title: 'Bastion • RDP / SSH + 2FA',
        desc: t('После 2FA Core передаёт RDP/SSH напрямую к доступному хосту либо через WSS-туннель и Relay к хосту филиала. Это два варианта доставки одного подключения.', 'After 2FA, Core forwards RDP/SSH directly to a reachable host or through the WSS tunnel and Relay to a branch host. These are two alternative delivery routes.'),
        badge: t('Через Core или Core + Relay', 'Via Core or Core + Relay'),
        nodes: ['node-bastion', 'node-core', 'node-push', 'node-host', 'node-relay', 'node-branch-lan'],
        lines: ['line-bastion', 'line-push', 'line-core-host', 'line-relay', 'line-relay-lan'],
        steps: ['Bastion', 'Core + 2FA', t('Хост Core или Relay', 'Core host or Relay'), t('Целевой хост', 'Target host')]
      },
      relay: {
        title: t('Доступ к хостам филиала', 'Branch host access'),
        desc: t('Relay инициирует исходящий WSS :443 к Core. После 2FA RDP/SSH-подключение идёт через этот канал до хоста филиала. Нужна связь WAN; при её полном обрыве удалённый туннель недоступен.', 'Relay initiates outbound WSS :443 to Core. After 2FA, the RDP/SSH connection uses this channel to reach a branch host. WAN connectivity is required; a complete outage makes the remote tunnel unavailable.'),
        badge: 'WSS :443 • RDP :3389 / SSH :22',
        nodes: ['node-bastion', 'node-core', 'node-push', 'node-relay', 'node-branch-lan'],
        lines: ['line-bastion', 'line-push', 'line-relay', 'line-relay-lan'],
        steps: ['Bastion', 'Core + 2FA', 'WSS :443 / Relay', t('Хост филиала', 'Branch host')]
      },
      'wifi-offline': {
        title: t('Wi-Fi филиала при обрыве WAN', 'Branch Wi-Fi during a WAN outage'),
        desc: t('Точки доступа используют локальный резервный RADIUS Relay и доступный кэш. Core, Push, SSO и удалённый RDP/SSH-туннель в этом аварийном сценарии не участвуют.', 'Access points use the local Relay backup RADIUS and available cached data. Core, Push, SSO and the remote RDP/SSH tunnel are not part of this offline scenario.'),
        badge: t('WAN недоступен • локальный кэш', 'WAN unavailable • local cache'),
        nodes: ['node-branch-wifi', 'node-relay'],
        lines: ['line-relay-wifi'],
        steps: [t('Wi-Fi филиала', 'Branch Wi-Fi'), 'Relay RADIUS', t('Локальный кэш', 'Local cache'), t('Доступ в Wi-Fi', 'Wi-Fi access')]
      }
    };
    let current = 'all';
    let zoom = 1;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

    function showInfo(data) {
      title.textContent = data.title;
      description.textContent = data.desc;
      badge.textContent = data.badge;
    }
    function centerNode(id, behavior) {
      const node = document.getElementById(id);
      if (!node) return;
      const box = node.getBoundingClientRect();
      const container = viewport.getBoundingClientRect();
      viewport.scrollTo({left: viewport.scrollLeft + box.x + box.width / 2 - container.x - container.width / 2, behavior: behavior || motion});
    }
    function applyScenario(key) {
      current = Object.prototype.hasOwnProperty.call(scenarios, key) ? key : 'all';
      const data = scenarios[current];
      showInfo(data);
      route.replaceChildren();
      data.steps.forEach(function (step) {
        const item = document.createElement('li');
        item.textContent = step;
        route.appendChild(item);
      });
      buttons.forEach(function (button) {
        const active = button.getAttribute('data-scenario') === current;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      nodes.forEach(function (node) {
        const inactive = !data.nodes.includes(node.id);
        node.classList.toggle('dimmed', inactive);
        node.classList.remove('highlighted');
        node.setAttribute('aria-pressed', 'false');
        node.setAttribute('tabindex', current === 'wifi-offline' && inactive ? '-1' : '0');
        node.setAttribute('aria-hidden', String(current === 'wifi-offline' && inactive));
      });
      lines.forEach(function (line) {
        const inactive = !data.lines.includes(line.id);
        line.classList.toggle('inactive', inactive);
        line.parentElement.classList.toggle('inactive', inactive);
      });
      viewport.classList.toggle('is-offline', current === 'wifi-offline');
      viewport.closest('.graph-wrapper').classList.toggle('offline-scenario', current === 'wifi-offline');
      viewport.querySelector('svg').setAttribute('viewBox', current === 'wifi-offline' ? '0 520 1120 190' : '0 0 1120 710');
      centerNode(current === 'wifi-offline' ? 'node-relay' : 'node-core');
    }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () { applyScenario(button.getAttribute('data-scenario')); });
    });
    nodes.forEach(function (node) {
      function select() {
        showInfo({title: node.dataset.title, desc: node.dataset.desc, badge: node.dataset.badge});
        nodes.forEach(function (other) {
          other.classList.toggle('highlighted', other === node);
          other.setAttribute('aria-pressed', String(other === node));
        });
        centerNode(node.id);
      }
      node.addEventListener('click', select);
      node.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
        if (event.key === 'Escape') { event.preventDefault(); applyScenario(current); }
      });
    });
    function updateZoom() {
      viewport.style.setProperty('--graph-base-width', Math.max(960, viewport.clientWidth) + 'px');
      viewport.style.setProperty('--graph-zoom', String(zoom));
      document.getElementById('graph-zoom-value').textContent = Math.round(zoom * 100) + '%';
      document.querySelector('[data-graph-zoom="out"]').disabled = zoom <= 0.75;
      document.querySelector('[data-graph-zoom="in"]').disabled = zoom >= 1.5;
    }
    document.querySelectorAll('[data-graph-zoom]').forEach(function (button) {
      button.addEventListener('click', function () {
        const action = button.getAttribute('data-graph-zoom');
        zoom = action === 'reset' ? 1 : Math.min(1.5, Math.max(0.75, Math.round((zoom + (action === 'in' ? 0.25 : -0.25)) * 100) / 100));
        updateZoom();
        centerNode(current === 'wifi-offline' ? 'node-relay' : 'node-core');
      });
    });
    window.addEventListener('resize', function () {
      updateZoom();
      centerNode(current === 'wifi-offline' ? 'node-relay' : 'node-core', 'auto');
    });
    updateZoom();
    applyScenario('all');
  }

  // 7. Robust Smooth Nav Scroll & Active ScrollSpy
  function initNav() {
    const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
    const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.getElementById('site-navigation');
    function closeMenu() {
      if (!menuButton || !navigation) return;
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
    }
    if (menuButton && navigation) {
      menuButton.addEventListener('click', function () {
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(open));
        navigation.classList.toggle('is-open', open);
      });
      navigation.addEventListener('click', function (event) {
        if (event.target.closest('a')) closeMenu();
      });
      document.addEventListener('click', function (event) {
        if (!event.target.closest('.site-header')) closeMenu();
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
          closeMenu();
          menuButton.focus();
        }
      });
      window.matchMedia('(min-width: 1341px)').addEventListener('change', closeMenu);
    }

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
