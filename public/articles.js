// Sample articles and rotating daily updates
(function(){
  const articles = [
    { title: 'New guidelines for hypertension management', date: '2026-08-04', excerpt: 'Experts recommend tailored blood pressure targets based on age and comorbidity. New study shows benefits in early intervention.', url: '#', image: 'https://picsum.photos/seed/hypertension/800/400', tags: ['Guidelines','Cardiology']},
    { title: 'Seasonal flu: what to expect this year', date: '2026-08-03', excerpt: 'Health authorities predict a mild season but advise vaccination for high-risk groups and good hygiene practices.', url: '#', image: 'https://picsum.photos/seed/flu/800/400', tags: ['Infectious','Prevention']},
    { title: 'Breakthrough in diabetes monitoring', date: '2026-08-02', excerpt: 'A non-invasive glucose monitor shows promising accuracy in early trials, potentially reducing finger-pricks.', url: '#', image: 'https://picsum.photos/seed/diabetes/800/400', tags: ['Diabetes','Tech']},
    { title: 'Mental health apps: benefits and risks', date: '2026-08-01', excerpt: 'A review highlights apps can help with mild symptoms but are not a replacement for professional care.', url: '#', image: 'https://picsum.photos/seed/mental/800/400', tags: ['Mental Health','Digital']}
  ];

  // Topic → image map (fallbacks for clearer matching)
  const topicImages = {
    hypertension: 'https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=1000&q=60',
    flu: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1000&q=60',
    diabetes: 'https://images.unsplash.com/photo-1582719478129-7ee9f2b63d23?auto=format&fit=crop&w=1000&q=60',
    mental: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=60',
    cardiology: 'https://images.unsplash.com/photo-1582719478179-0b2e3b6d6a3b?auto=format&fit=crop&w=1000&q=60',
    default: 'https://picsum.photos/800/400?grayscale'
  };

  function chooseImage(article) {
    // prefer explicit image if provided
    if (article.image) return article.image;
    const title = (article.title || '').toLowerCase();
    const tags = (article.tags || []).join(' ').toLowerCase();
    // keyword matching
    if (title.includes('hypertension') || tags.includes('cardiology')) return topicImages.hypertension;
    if (title.includes('flu') || tags.includes('infect')) return topicImages.flu;
    if (title.includes('diabetes') || tags.includes('diabetes')) return topicImages.diabetes;
    if (title.includes('mental') || tags.includes('mental')) return topicImages.mental;
    if (tags.includes('cardiology')) return topicImages.cardiology;
    return topicImages.default;
  }

  let index = 0;
  function render() {
    const list = document.getElementById('updatesList');
    const dateEl = document.getElementById('updatesDate');
    if (!list) return;
    // show three items starting from index
    list.innerHTML = '';
    for (let i=0;i<3;i++){
      const a = articles[(index + i) % articles.length];
      const div = document.createElement('div');
      div.className = 'update-item';
      div.setAttribute('tabindex','0');
      div.dataset.index = (index + i) % articles.length;
      const img = chooseImage(a);
      div.innerHTML = `
        <div class="article-figure"><img src="${img}" alt="${a.title}"></div>
        <h4>${a.title}</h4>
        <div class="article-meta">${a.date} • ${a.tags.join(' • ')}</div>
        <p>${a.excerpt}</p>
      `;
      list.appendChild(div);
    }
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString();
  }

  function next(){ index = (index + 1) % articles.length; render(); }
  function prev(){ index = (index - 1 + articles.length) % articles.length; render(); }

  document.addEventListener('DOMContentLoaded', function(){
    render();
    const nextBtn = document.getElementById('nextUpdate');
    const prevBtn = document.getElementById('prevUpdate');
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);
    // auto-rotate every 10s
    setInterval(next, 10000);

    // Open article modal on click or Enter
    document.getElementById('updatesList') && document.getElementById('updatesList').addEventListener('click', function(e){
      const item = e.target.closest && e.target.closest('.update-item'); if (!item) return; openArticle(item.dataset.index);
    });
    document.getElementById('updatesList') && document.getElementById('updatesList').addEventListener('keydown', function(e){
      if (e.key === 'Enter') { const item = e.target.closest && e.target.closest('.update-item'); if (item) openArticle(item.dataset.index); }
    });

    // Modal handlers
    function openArticle(i){
      const art = articles[Number(i)]; if (!art) return;
      const modal = document.getElementById('articleModal');
      const title = document.getElementById('articleModalTitle');
      const body = document.getElementById('articleModalBody');
      if (!modal || !title || !body) return;
      title.textContent = art.title;
      const modalImg = chooseImage(art);
      body.innerHTML = `<div class="article-figure"><img src="${modalImg}" alt="${art.title}"></div><div class="article-meta">${art.date} • ${art.tags.join(' • ')}</div><div class="article-content"><p>${art.excerpt}</p><p>Read full article at <a href="${art.url}">source</a>.</p></div>`;
      modal.style.display = 'block'; modal.setAttribute('aria-hidden','false');
      // focus trap: focus first focusable
      try{ modal.querySelector('button, [href], input, textarea, select').focus(); }catch(e){}
    }

    // close modal
    document.addEventListener('click', function(e){
      const close = e.target.closest && e.target.closest('.modal-close');
      const overlay = e.target && e.target.id === 'articleModal';
      if (close) { e.preventDefault(); closeModal('articleModal'); }
      if (overlay) { e.preventDefault(); closeModal('articleModal'); }
    });
    function closeModal(id){ const m = document.getElementById(id); if (!m) return; m.style.display='none'; m.setAttribute('aria-hidden','true'); }
  });

})();
