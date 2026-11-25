// Simple chat modal handler: intercepts links with class 'chat' or 'chat-btn'
(function(){
  function openModal(url, title) {
    const modal = document.getElementById('chatModal');
    const iframe = document.getElementById('chatModalIframe');
    const header = document.getElementById('chatModalTitle');
    iframe.src = url;
    header.textContent = title || 'Chat';
    // show/hide close or back button based on caller and entry point
    const closeBtn = modal.querySelector('.chat-modal-close');
    const backBtn = modal.querySelector('.chat-modal-back');
    const hide = modal.dataset.hideClose === 'true';
    const showBack = modal.dataset.showBack !== 'false';
    if (backBtn) backBtn.style.display = showBack ? '' : 'none';
    if (closeBtn) closeBtn.style.display = (hide ? 'none' : (showBack ? 'none' : ''));
    modal.classList.add('active');
    // remember which parent page to return to (useful for specialist -> doctor flows)
    try { if (modal) modal.dataset.returnTo = window.location.href; } catch(e) {}
  }

  function closeModal(){
    const modal = document.getElementById('chatModal');
    const iframe = document.getElementById('chatModalIframe');
    iframe.src = 'about:blank';
    modal.classList.remove('active');
    // If this modal was opened from the mobile menu, reopen the mobile drawer on close
    try {
      if (modal && modal.dataset && modal.dataset.returnToMobile === 'true' && window.innerWidth <= 640) {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuToggle = document.getElementById('menu-toggle');
        if (mobileMenu) mobileMenu.classList.add('active');
        if (menuToggle) menuToggle.focus();
      }
    } catch(e) {}
    // If opened from mobile, reopen mobile menu root and collapse submenus
    try {
      if (modal && modal.dataset && modal.dataset.returnToMobile === 'true' && window.innerWidth <= 640) {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          // ensure mobile menu is visible
          mobileMenu.classList.add('active');
          // collapse any open submenus so user sees the root list
          document.querySelectorAll('#mobile-menu .mobile-submenu').forEach(s => {
            s.classList.remove('active');
            s.setAttribute('aria-hidden', 'true');
          });
          // reset expander triggers
          document.querySelectorAll('#mobile-menu .mobile-item.mobile-expand').forEach(t => {
            try { t.setAttribute('aria-expanded', 'false'); } catch(e) {}
            const chev = t.querySelector && t.querySelector('.chev'); if (chev) chev.textContent = '▸';
          });
          // focus first top-level link or toggle in the mobile menu
          try {
            const first = mobileMenu.querySelector('.mobile-item') || mobileMenu.querySelector('a');
            if (first) first.focus();
          } catch(e) {}
        }
      }
    } catch(e) {}
    // reset hide-close flag and restore button
    try{ delete modal.dataset.hideClose; delete modal.dataset.showBack; const cb = modal.querySelector('.chat-modal-close'); if (cb) cb.style.display = 'none'; const bb = modal.querySelector('.chat-modal-back'); if (bb) bb.style.display = ''; }catch(e){}
    try{ delete modal.dataset.returnTo; delete modal.dataset.returnToMobile; delete modal.dataset.returnToSubmenu; }catch(e){}
  }

  function backInModal(){
    closeModal();
  }

  document.addEventListener('click', function(e){
    // ignore clicks that happen inside the chat modal itself
    if (e.target.closest && e.target.closest('#chatModal')) return;
    const a = e.target.closest && e.target.closest('a.chat, a.chat-btn, button.chat');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href');
    // Determine doctor param from href or data-doctor
    let doctor = a.dataset.doctor || null;
    let url = href || ('chat.html' + (doctor ? '?doctor=' + encodeURIComponent(doctor) : ''));
    if (href && href.includes('chat.html')) {
      url = href;
      const params = new URL(href, location.href).searchParams;
      doctor = doctor || params.get('doctor');
    }
    const title = doctor ? 'Chat with ' + decodeURIComponent(doctor.replace(/\+/g,' ')) : 'Chat';
    // honor hide-close flag on the triggering element
    const hideClose = a.dataset.hideClose === 'true' || a.classList.contains('no-close');
    const modal = document.getElementById('chatModal');
    if (modal) modal.dataset.hideClose = hideClose ? 'true' : 'false';
    // remember if the click originated from the mobile menu so we can restore it on close
    try { if (modal) modal.dataset.returnToMobile = !!a.closest('#mobile-menu') ? 'true' : 'false'; } catch(e) {}
    try {
      const submenu = a.closest && a.closest('.mobile-submenu');
      if (modal && submenu && submenu.id) modal.dataset.returnToSubmenu = submenu.id;
    } catch(e) {}
    // when opening the 'chat-with-doctor' listing page, prefer showing Close instead of Back
    const wantCloseInsteadOfBack = href && href.includes('chat-with-doctor.html') && !href.includes('doctor=');
    if (modal) modal.dataset.showBack = wantCloseInsteadOfBack ? 'false' : 'true';
    openModal(url, title);
  });

  window.closeChatModal = closeModal;
  // Close when clicking overlay or close button; use closest() so clicks on child elements work
  document.addEventListener('click', function(e){
    try {
      const clickedOverlay = e.target.id === 'chatModal';
      const clickedClose = e.target.closest && e.target.closest('.chat-modal-close');
      const clickedBack = e.target.closest && e.target.closest('.chat-modal-back');
      if (clickedClose) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
        // if this modal was opened from the Consult->Chat-with-Doctor listing, treat Close as navigation back
        const modal = document.getElementById('chatModal');
        const showBack = modal && modal.dataset && modal.dataset.showBack !== 'false';
        if (modal && modal.dataset && modal.dataset.showBack === 'false') {
          try { window.location.href = 'MAIN.html'; return; } catch (err) { /* fallthrough to close */ }
        }
        closeModal();
      }
      if (clickedBack) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
        backInModal();
      }
      if (clickedOverlay) { e.preventDefault && e.preventDefault(); e.stopPropagation && e.stopPropagation(); closeModal(); }
    } catch (err) { }
  });

  // Listen for messages from iframe chat pages asking the parent to navigate back
  window.addEventListener('message', function(evt){
    try{
      const msg = evt && evt.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'chat-back') {
        const modal = document.getElementById('chatModal');
        const iframe = document.getElementById('chatModalIframe');
        if (!modal || !iframe || evt.source !== iframe.contentWindow) return;

        const returnTo = modal.dataset && modal.dataset.returnTo;
        if (returnTo && new URL(returnTo, window.location.href).href !== window.location.href) {
          window.location.href = returnTo;
          return;
        }
        closeModal();
      }
    }catch(e){}
  });
})();
