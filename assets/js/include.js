// Simple include script to load partial HTML fragments into pages
(function () {
  function loadFragment(path) {
    return fetch(path).then(resp => { if (!resp.ok) throw new Error('Not found'); return resp.text(); });
  }

  function insertAtBodyStart(html) {
    // insert header at top of body
    const first = document.body.firstChild;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) {
      document.body.insertBefore(temp.firstChild, first);
    }
  }

  function insertFooter(html) {
    // append footer near end of body
    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) {
      document.body.appendChild(temp.firstChild);
    }
  }

  // compute base path: if current URL path contains '/pages/', go up one level
  const path = window.location.pathname;
  const base = path.includes('/pages/') ? '..' : '.';

  // Try both base and absolute root if needed
  const headerPaths = [`${base}/partials/header.html`, '/partials/header.html'];
  const footerPaths = [`${base}/partials/footer.html`, '/partials/footer.html'];

  // Load header (try base-relative first, then absolute)
  (async function() {
    let html = null;
    for (const p of headerPaths) {
      try { html = await loadFragment(p); break; } catch (e) { /* try next */ }
    }
    if (html) insertAtBodyStart(html);

    // after header inserted, turn data-href into real hrefs
    document.querySelectorAll('[data-href]').forEach(el => {
      el.setAttribute('href', el.getAttribute('data-href'));
    });

    // Load footer
    for (const p of footerPaths) {
      try { html = await loadFragment(p); break; } catch (e) { html = null; }
    }
    if (html) insertFooter(html);
  })();
})();