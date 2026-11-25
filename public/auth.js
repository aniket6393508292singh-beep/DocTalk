// Auth flows backed by the DockTalk API.
(function () {
  const CURRENT_KEY = 'docktalk_current_user';
  const TOKEN_KEY = 'docktalk_auth_token';

  function setCurrent(user, token) {
    try {
      if (user) localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
      else localStorage.removeItem(CURRENT_KEY);
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    updateAuthUI();
    document.dispatchEvent(new CustomEvent('docktalk-auth-changed'));
  }

  function clearCurrent() {
    try {
      localStorage.removeItem(CURRENT_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    updateAuthUI();
    document.dispatchEvent(new CustomEvent('docktalk-auth-changed'));
  }

  function getCurrent() {
    try { return JSON.parse(localStorage.getItem(CURRENT_KEY)); } catch (e) { return null; }
  }

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }

  const authButtons = () => document.querySelectorAll('#authBtn, #mobileAuthBtn');

  function openModal(mode) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('.auth-pane').forEach((p) => p.style.display = 'none');
    const pane = document.querySelector('.auth-pane[data-mode="' + mode + '"]');
    if (pane) pane.style.display = '';
    try { modal.querySelector('input, button, select, textarea').focus(); } catch (e) {}
  }

  function closeModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  function updateAuthUI() {
    const cur = getCurrent();
    const buttons = authButtons();
    if (!buttons.length) return;
    const label = cur && cur.name ? 'Hi, ' + (cur.name.split(' ')[0] || cur.name) + ' (Sign out)' : 'Sign In / Up';
    buttons.forEach((btn) => { btn.textContent = label; });
  }

  async function tryRemoteLogin(payload, endpoint) {
    const api = window.DockTalkAPI;
    if (!api) throw new Error('DockTalk API is unavailable.');
    const result = await api.request(endpoint, { method: 'POST', body: payload, auth: false });
    if (!result || !result.user || !result.token) throw new Error('The server returned an invalid authentication response.');
    setCurrent(result.user, result.token);
    return result;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const current = getCurrent();
    const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
    const isMainPage = normalizedPath === '/' ||
      /\/(?:MAIN|index)\.html$/i.test(normalizedPath);
    if (current && current.role === 'doctor' && isMainPage) {
      window.location.replace('doctor-dashboard.html');
      return;
    }

    if (!document.getElementById('authModal')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = '\n<div id="authModal" class="modal" role="dialog" aria-hidden="true" style="display:none;">\n  <div class="modal-content">\n    <div class="modal-header">\n      <h2>Account</h2>\n      <button class="modal-close" aria-label="Close">✕</button>\n    </div>\n    <div class="modal-body">\n      <div class="auth-pane" data-mode="signin" style="display:none;">\n        <form id="signinForm">\n          <label>Email<br><input type="email" name="email" required></label>\n          <label>Password<br><input type="password" name="password" required></label>\n          <div class="modal-actions">\n            <button class="btn primary" type="submit">Sign In</button>\n            <button type="button" class="btn secondary" id="toSignup">Create account</button>\n          </div>\n        </form>\n      </div>\n      <div class="auth-pane" data-mode="signup" style="display:none;">\n        <form id="signupForm">\n          <label>Name<br><input type="text" name="name" required></label>\n          <label>Email<br><input type="email" name="email" required></label>\n          <label>Password<br><input type="password" name="password" required></label>\n          <label>Confirm Password<br><input type="password" name="confirm" required></label>\n          <div class="modal-actions">\n            <button class="btn primary" type="submit">Create account</button>\n            <button type="button" class="btn secondary" id="toSignin">Have an account?</button>\n          </div>\n        </form>\n      </div>\n    </div>\n  </div>\n</div>\n';
      document.body.appendChild(wrapper);
    }

    const token = getToken();
    if (token && !getCurrent()) {
      try {
        if (window.DockTalkAPI) {
          window.DockTalkAPI.me().then((response) => {
            if (response && response.user) setCurrent(response.user, token);
          }).catch(() => {
            clearCurrent();
          });
        }
      } catch (error) {
        clearCurrent();
      }
    }

    updateAuthUI();

    authButtons().forEach((btn) => {
      btn.addEventListener('click', function () {
        const cur = getCurrent();
        if (cur) {
          if (confirm('Sign out?')) { clearCurrent(); }
          return;
        }
        openModal('signin');
      });
    });

    document.addEventListener('click', function (e) {
      const close = e.target.closest && e.target.closest('.modal-close');
      const overlay = e.target.id === 'authModal';
      if (close) { e.preventDefault(); closeModal(); }
      if (overlay) { e.preventDefault(); closeModal(); }
    });

    document.body.addEventListener('click', function (e) {
      const toSignup = e.target.closest && e.target.closest('#toSignup');
      const toSignin = e.target.closest && e.target.closest('#toSignin');
      if (toSignup) openModal('signup');
      if (toSignin) openModal('signin');
    });

    document.body.addEventListener('submit', async function (e) {
      const signup = e.target.id === 'signupForm';
      const signin = e.target.id === 'signinForm';
      if (!signup && !signin) return;
      e.preventDefault();

      if (signup) {
        const form = e.target;
        const fd = new FormData(form);
        const name = (fd.get('name') || '').trim();
        const email = (fd.get('email') || '').trim().toLowerCase();
        const pass = fd.get('password') || '';
        const conf = fd.get('confirm') || '';

        if (!name || !email || !pass) {
          alert('Please fill all fields.');
          return;
        }
        if (pass !== conf) {
          alert('Passwords do not match.');
          return;
        }

        try {
          await tryRemoteLogin({ name, email, password: pass }, '/auth/register');
          alert('Account created. You are signed in.');
          closeModal();
        } catch (error) {
          alert(error.message);
        }
      }

      if (signin) {
        const form = e.target;
        const fd = new FormData(form);
        const email = (fd.get('email') || '').trim().toLowerCase();
        const pass = fd.get('password') || '';

        if (!email || !pass) {
          alert('Please enter both email and password.');
          return;
        }

        try {
          const remoteResult = await tryRemoteLogin({ email, password: pass }, '/auth/login');
          closeModal();
          if (remoteResult.user.role === 'doctor') {
            window.location.href = 'doctor-dashboard.html';
            return;
          }
          alert('Signed in as ' + remoteResult.user.name);
        } catch (error) {
          alert(error.message);
        }
      }
    });
  });
})();
