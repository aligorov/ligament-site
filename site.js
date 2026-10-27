/**
 * Ligament Site JavaScript
 * Strict Zero-Dependency & CSP-compliant (no eval, no innerHTML, pure textContent/classList)
 */
(function () {
  'use strict';

  // 0. Language: remember explicit choices (?lang= or RU/EN switcher),
  // never auto-redirect — show a dismissible one-click suggestion instead.
  function initLanguage() {
    const isEn = document.documentElement.lang === 'en';
    const params = new URLSearchParams(window.location.search);
    const queryLanguage = params.get('lang');

    function rememberLanguage(lang) {
      try {
        localStorage.setItem('lang', lang);
        localStorage.removeItem('lang-suggestion-dismissed');
      } catch (e) {}
    }

    if (queryLanguage) {
      rememberLanguage(queryLanguage.toLowerCase().startsWith('en') ? 'en' : 'ru');
    }

    let preferred;
    try { preferred = localStorage.getItem('lang'); } catch (e) {}
    if (!preferred) {
      const systemLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      preferred = systemLanguage.toLowerCase().startsWith('en') ? 'en' : 'ru';
    }
    const wantsEnglish = preferred.toLowerCase().startsWith('en');
    if (wantsEnglish === isEn) return;

    let dismissed = false;
    try { dismissed = localStorage.getItem('lang-suggestion-dismissed') === '1'; } catch (e) {}
    if (dismissed) return;

    const indexFile = isEn ? '/en/index.html' : '/index.html';
    const searchWithoutLang = new URLSearchParams(window.location.search);
    searchWithoutLang.delete('lang');
    const cleanSearch = searchWithoutLang.toString();
    const href = window.location.origin + indexFile + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash;

    const bar = document.createElement('aside');
    bar.className = 'lang-suggest-bar';
    bar.setAttribute('role', 'note');
    bar.setAttribute('aria-label', isEn ? 'Language suggestion' : 'Предложение языка');

    const link = document.createElement('a');
    link.className = 'lang-switch';
    link.setAttribute('hreflang', wantsEnglish ? 'en' : 'ru');
    link.href = href;
    link.textContent = wantsEnglish ? '🇬🇧 Switch to English' : '🇷🇺 Переключиться на русский';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'lang-suggest-close';
    close.setAttribute('aria-label', isEn ? 'Hide language suggestion' : 'Скрыть предложение языка');
    close.textContent = '✕';
    close.addEventListener('click', function () {
      bar.remove();
      try { localStorage.setItem('lang-suggestion-dismissed', '1'); } catch (e) {}
    });

    bar.appendChild(link);
    bar.appendChild(close);
    document.body.appendChild(bar);

    document.querySelectorAll('.lang-switch').forEach(function (switcher) {
      switcher.addEventListener('click', function () {
        rememberLanguage(switcher.getAttribute('hreflang') || (isEn ? 'ru' : 'en'));
      });
    });
  }

  initLanguage();

  // 1. Theme Toggle: Default to DARK for signature enterprise cyber aesthetic
  const THEME_META_COLORS = { dark: '#07090e', light: '#f1f5f9' };
  function applyThemeMeta(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_META_COLORS[theme] || THEME_META_COLORS.dark);
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Always default to 'dark' unless user explicitly saved 'light'
    const initialTheme = savedTheme === 'light' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', initialTheme);
    applyThemeMeta(initialTheme);

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
        applyThemeMeta(newTheme);
        updateBrandLogos(newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }
  }

  // 2. Interactive Scoped Tabs (WAI-ARIA tab pattern)
  function initTabs() {
    function select(buttons, panes, active) {
      buttons.forEach(function (btn) {
        const isActive = btn === active;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      panes.forEach(function (pane) {
        pane.classList.toggle('active', pane.id === active.getAttribute('data-tab'));
      });
    }

    function bind(buttons, panes) {
      if (!buttons.length) return;
      const initial = Array.prototype.find.call(buttons, function (btn) {
        return btn.classList.contains('active');
      }) || buttons[0];
      select(buttons, panes, initial);
      buttons.forEach(function (btn, index) {
        btn.addEventListener('click', function () { select(buttons, panes, btn); });
        btn.addEventListener('keydown', function (event) {
          let target = null;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            target = buttons[(index + 1) % buttons.length];
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            target = buttons[(index - 1 + buttons.length) % buttons.length];
          } else if (event.key === 'Home') {
            target = buttons[0];
          } else if (event.key === 'End') {
            target = buttons[buttons.length - 1];
          }
          if (target) {
            event.preventDefault();
            target.focus();
            select(buttons, panes, target);
          }
        });
      });
    }

    const tabGroups = document.querySelectorAll('.tabs-group');
    if (tabGroups.length) {
      tabGroups.forEach(function (group) {
        bind(group.querySelectorAll('.tab-btn'), group.querySelectorAll('.tab-content'));
      });
      return;
    }

    document.querySelectorAll('.tabs-nav').forEach(function (nav) {
      const buttons = nav.querySelectorAll('.tab-btn');
      const paneIds = (function () {
        const registry = {};
        buttons.forEach(function (btn) {
          const pane = document.getElementById(btn.getAttribute('data-tab'));
          if (pane) registry[pane.id] = pane;
        });
        return Object.keys(registry).map(function (id) { return registry[id]; });
      })();
      bind(buttons, paneIds.length ? paneIds : document.querySelectorAll('.tab-content'));
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

  // 4. Copy-to-Clipboard (with legacy fallback + failure feedback)
  function initClipboard() {
    const isEn = document.documentElement.lang === 'en';

    function legacyCopy(text) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.setAttribute('aria-hidden', 'true');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(area);
      return copied;
    }

    function acknowledge(btn, ok) {
      const originalText = btn.textContent;
      btn.textContent = ok
        ? (btn.getAttribute('data-copied-label') || (isEn ? '✓ Copied!' : '✓ Скопировано!'))
        : (isEn ? '✕ Copy failed' : '✕ Не удалось');
      btn.setAttribute('disabled', 'disabled');
      setTimeout(function () {
        btn.textContent = originalText;
        btn.removeAttribute('disabled');
      }, 2000);
    }

    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.setAttribute('aria-live', 'polite');
    });

    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;

      const text = btn.getAttribute('data-copy');
      if (!text) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { acknowledge(btn, true); },
          function () { acknowledge(btn, legacyCopy(text)); }
        );
      } else {
        acknowledge(btn, legacyCopy(text));
      }
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

  // Docs / Wiki Table of Contents active link spy
  function initDocsToc() {
    const sidebar = document.querySelector('.docs-sidebar, .wiki-sidebar');
    if (!sidebar) return;

    const links = sidebar.querySelectorAll('.docs-nav-link, .wiki-nav-item');
    const sections = Array.from(links).map(function (link) {
      const href = link.getAttribute('href');
      return href && href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
    }).filter(Boolean);

    if (!sections.length) return;

    function updateActive() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const offset = 140;
      let current = null;

      for (let i = 0; i < sections.length; i++) {
        const top = sections[i].offsetTop - offset;
        if (scrollY >= top) {
          current = sections[i];
        } else {
          break;
        }
      }

      if (!current && sections.length > 0) {
        current = sections[0];
      }

      links.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href && current && href === '#' + current.id) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  // Client-side quick filter for Wiki
  function initWikiSearch() {
    const searchInput = document.getElementById('wiki-search');
    const sidebar = document.getElementById('wiki-nav-sidebar');
    if (!searchInput || !sidebar) return;

    searchInput.addEventListener('input', function () {
      const q = searchInput.value.trim().toLowerCase();
      const items = sidebar.querySelectorAll('.wiki-nav-item');
      items.forEach(function (item) {
        const text = item.textContent.toLowerCase();
        const match = !q || text.includes(q);
        item.style.display = match ? 'flex' : 'none';
      });
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
    initDocsToc();
    initWikiSearch();
    initNeuralMeshBackground();
  }

  // 11. Фоновая анимированная кибер-сеть (Neural Mesh Constellation)
  function initNeuralMeshBackground() {
    let canvas = document.getElementById('bg-neural-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-neural-canvas';
      canvas.className = 'bg-neural-canvas';
      document.body.prepend(canvas);
    }
    if (!canvas || !canvas.getContext) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = canvas.getContext('2d');
    let particles = [];
    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { x: -9999, y: -9999, active: false };
    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });
    window.addEventListener('pointerleave', function () {
      mouse.active = false;
    }, { passive: true });

    function isDarkTheme() {
      return document.documentElement.getAttribute('data-theme') !== 'light';
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initParticles();
    }
    window.addEventListener('resize', resize, { passive: true });

    const maxDist = 165;
    const maxDistSq = maxDist * maxDist;
    const mouseMaxDist = 180;
    const mouseMaxDistSq = mouseMaxDist * mouseMaxDist;

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.r = Math.random() * 2.0 + 1.6;
        this.alpha = Math.random() * 0.35 + 0.6;
        this.isCyan = Math.random() > 0.4;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }
      draw(dark) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        const color = dark
          ? (this.isCyan ? '#22d3ee' : '#818cf8')
          : (this.isCyan ? '#0284c7' : '#4f46e5');
        ctx.fillStyle = color;
        ctx.globalAlpha = dark ? this.alpha : (this.alpha * 0.7);
        ctx.shadowBlur = dark ? 10 : 6;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }
    }

    function initParticles() {
      particles = [];
      const count = Math.max(55, Math.floor((w * h) / 11000));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    resize();

    function render() {
      ctx.clearRect(0, 0, w, h);
      const dark = isDarkTheme();
      const lineStroke = dark ? '#22d3ee' : '#4f46e5';
      const lineBaseAlpha = dark ? 0.42 : 0.25;

      // Связи между частицами
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dSq = dx * dx + dy * dy;
          if (dSq < maxDistSq) {
            const dist = Math.sqrt(dSq);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = lineStroke;
            ctx.globalAlpha = (1 - dist / maxDist) * lineBaseAlpha;
            ctx.lineWidth = 1.1;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }

        // Интерактивная лазерная нить к курсору мыши
        if (mouse.active) {
          const mdx = particles[i].x - mouse.x;
          const mdy = particles[i].y - mouse.y;
          const mdSq = mdx * mdx + mdy * mdy;
          if (mdSq < mouseMaxDistSq) {
            const mdist = Math.sqrt(mdSq);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = dark ? '#38bdf8' : '#0284c7';
            ctx.globalAlpha = (1 - mdist / mouseMaxDist) * (dark ? 0.55 : 0.35);
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }

        particles[i].update();
        particles[i].draw(dark);
      }

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
