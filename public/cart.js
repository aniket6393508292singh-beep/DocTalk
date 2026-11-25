(function () {
  const STORAGE_KEY = 'docktalk_cart_v1';
  let cart = [];
  let orderHistory = [];

  const cartToggles = () => document.querySelectorAll('#cartToggle, #mobileCartToggle');
  const navCartCount = () => document.getElementById('navCartCount');
  const mobileCartCount = () => document.getElementById('mobileCartCount');
  const globalCart = () => document.getElementById('globalCart');
  const cartItemsEl = () => document.getElementById('globalCartItems');
  const cartTotalEl = () => document.getElementById('globalCartTotal');
  const orderHistoryEl = () => document.getElementById('globalOrderHistory');

  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {} }
  function load() { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) cart = JSON.parse(raw) || []; } catch (e) { cart = []; } }
  function getHistoryKey() {
    const api = window.DockTalkAPI;
    const user = api && api.getCurrentUser ? api.getCurrentUser() : null;
    const identity = user && (user.id || user.email);
    return identity ? `docktalk_order_history_${identity}` : null;
  }

  function saveHistory() {
    const key = getHistoryKey();
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(orderHistory)); } catch (e) {}
  }

  function loadCachedHistory() {
    const key = getHistoryKey();
    orderHistory = [];
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) orderHistory = JSON.parse(raw) || [];
    } catch (e) {
      orderHistory = [];
    }
  }

  async function loadServerHistory() {
    const api = window.DockTalkAPI;
    if (!api || !api.getToken()) {
      orderHistory = [];
      renderHistory();
      return;
    }

    try {
      const orders = await api.getOrders();
      orderHistory = (Array.isArray(orders) ? orders : []).map((order) => ({
        id: order.id ? 'ORD-' + order.id : 'ORD-unknown',
        total: Number(order.total || 0),
        items: (order.items || []).map((item) => typeof item === 'string' ? item : item.name).filter(Boolean),
        date: order.created_at ? new Date(order.created_at).toLocaleString() : ''
      }));
      orderHistory = orderHistory.slice(0, 8);
      saveHistory();
      renderHistory();
    } catch (error) {
      orderHistory = [];
      renderHistory();
      console.error('Failed to load order history:', error);
    }
  }

  function renderNavCount() {
    const el = navCartCount(); if (!el) return;
    el.textContent = cart.length;
    const mobileEl = mobileCartCount(); if (mobileEl) mobileEl.textContent = cart.length;
  }

  function renderCart() {
    const container = cartItemsEl(); if (!container) return;
    const total = cart.reduce((s, i) => s + (Number(i.price) || 0), 0);
    cartTotalEl() && (cartTotalEl().textContent = total);
    if (!cart.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-illustration">🛒</div>
          <div>
            <strong>Your cart is empty</strong>
            <div class="empty-sub">Add medicines, test kits, or other items to get started.</div>
          </div>
          <div class="empty-cta">
            <a href="pharmacy.html" class="btn primary">Shop Pharmacy</a>
            <a href="health-tools.html" class="btn secondary">Browse Tools</a>
          </div>
        </div>
      `;
      return;
    }
    container.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <div class="cart-item-meta">${item.type || ''}</div>
        </div>
        <div class="cart-item-price">₹${item.price}</div>
        <button class="cart-remove" type="button" data-index="${idx}">×</button>
      </div>
    `).join('');
  }

  function renderHistory() {
    const container = orderHistoryEl(); if (!container) return;
    if (!orderHistory.length) {
      container.innerHTML = '<div class="history-empty">No saved orders yet.</div>';
      return;
    }
    container.innerHTML = orderHistory.slice(0, 5).map((order) => `
      <div class="history-item">
        <div class="history-item-top">
          <strong>${order.id}</strong>
          <span>₹${order.total}</span>
        </div>
        <div class="history-item-meta">${(order.items || []).join(', ')}</div>
        <div class="history-item-date">${order.date}</div>
      </div>
    `).join('');
  }

  function openCart() {
    const el = globalCart(); if (!el) return; el.classList.add('active'); el.setAttribute('aria-hidden', 'false');
    const mobile = document.getElementById('mobile-menu'); if (mobile) mobile.classList.remove('active');
  }

  function closeCart() {
    const el = globalCart(); if (!el) return; el.classList.remove('active'); el.setAttribute('aria-hidden', 'true');
  }

  function ensureGlobalCartMarkup() {
    if (globalCart()) return;
    const cartMarkup = document.createElement('aside');
    cartMarkup.id = 'globalCart';
    cartMarkup.className = 'global-cart';
    cartMarkup.setAttribute('role', 'dialog');
    cartMarkup.setAttribute('aria-hidden', 'true');
    cartMarkup.innerHTML = `
      <div class="global-cart-content">
        <div class="global-cart-header">
          <h3>Cart</h3>
          <button class="cart-close" type="button" aria-label="Close">✕</button>
        </div>
        <div id="globalCartItems" class="cart-items">
          <p class="empty-state">Your cart is empty.</p>
        </div>
        <div class="cart-history">
          <h4>Order History</h4>
          <div id="globalOrderHistory" class="history-items"></div>
        </div>
        <div class="cart-footer">
          <div class="cart-total">Total: ₹<span id="globalCartTotal">0</span></div>
          <button class="btn primary" type="button" id="globalCheckout">Checkout</button>
        </div>
      </div>
    `;
    document.body.appendChild(cartMarkup);
  }

  function addToCart(name, price, type) {
    cart.push({ name, price: Number(price) || 0, type: type || '' });
    save();
    renderCart();
    renderNavCount();
  }

  function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
      cart.splice(index, 1);
      save();
      renderCart();
      renderNavCount();
    }
  }

  async function saveCheckoutHistory() {
    if (!cart.length) return;

    const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const items = cart.map((item) => item.name);
    const order = {
      id: `ORD-${Date.now()}`,
      total,
      items,
      date: new Date().toLocaleString()
    };

    const api = window.DockTalkAPI;
    if (!api || !api.getToken()) {
      throw new Error('Please sign in before placing an order.');
    }

    const response = await api.placeOrder(cart.map((item) => ({ name: item.name, price: item.price, type: item.type })));
    if (!response || !response.order) {
      throw new Error('The server did not return the saved order.');
    }
    if (response && response.order) {
      order.id = response.order.id ? 'ORD-' + response.order.id : order.id;
      order.total = Number(response.order.total || total);
    }

    await loadServerHistory();
  }

  window.addToCart = addToCart;

  load();
  loadCachedHistory();
  ensureGlobalCartMarkup();
  document.addEventListener('DOMContentLoaded', function () {
    renderNavCount();
    renderCart();
    renderHistory();
    loadServerHistory();

    document.addEventListener('docktalk-auth-changed', function () {
      loadCachedHistory();
      renderHistory();
      loadServerHistory();
    });

    cartToggles().forEach((toggle) => {
      toggle.addEventListener('click', function () {
        const c = globalCart();
        if (c && c.classList.contains('active')) closeCart();
        else openCart();
      });
    });

    document.addEventListener('click', async function (e) {
      const closeBtn = e.target.closest && e.target.closest('.cart-close');
      const overlay = e.target.id === 'globalCart';
      const removeBtn = e.target.closest && e.target.closest('.cart-remove');
      const checkoutBtn = e.target.closest && e.target.closest('#globalCheckout');
      if (removeBtn) {
        const idx = Number(removeBtn.getAttribute('data-index'));
        removeFromCart(idx);
      }
      if (closeBtn) { e.preventDefault(); closeCart(); }
      if (overlay) { e.preventDefault(); closeCart(); }
      if (checkoutBtn) {
        if (!cart.length) { alert('Your cart is empty.'); return; }
        try {
          await saveCheckoutHistory();
        } catch (error) {
          alert(`Order could not be saved: ${error.message}`);
          return;
        }
        alert('Order placed — saved to server.');
        cart = [];
        save();
        renderCart();
        renderNavCount();
        closeCart();
      }
    });
  });
})();
