// include script to load partial HTML fragments into pages
(async function () {
  function loadFragment(path) {
    return fetch(path).then(resp => { if (!resp.ok) throw new Error('Not found'); return resp.text(); });
  }

  function insertAtBodyStart(html) {
    const first = document.body.firstChild;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) {
      document.body.insertBefore(temp.firstChild, first);
    }
  }

  function insertFooterToBody(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) {
      document.body.appendChild(temp.firstChild);
    }
  }

  // compute base path: if current URL path contains '/pages/', go up one level
  const path = window.location.pathname;
  const base = path.includes('/pages/') ? '..' : '.';

  const headerPaths = [`${base}/partials/header.html`, '/partials/header.html'];
  const footerPaths = [`${base}/partials/footer.html`, '/partials/footer.html'];

  try {
    // load header
    let html = null;
    for (const p of headerPaths) {
      try { html = await loadFragment(p); break; } catch (e) { html = null; }
    }
    if (html) {
      const device = document.querySelector('.device-iphone-16');
      if (device) {
        const temp = document.createElement('div'); temp.innerHTML = html;
        while (temp.firstChild) device.insertBefore(temp.firstChild, device.firstChild);
      } else {
        insertAtBodyStart(html);
      }
    }

    // after header inserted, turn data-href into real hrefs
    document.querySelectorAll('[data-href]').forEach(el => {
      el.setAttribute('href', el.getAttribute('data-href'));
    });

    // load footer
    html = null;
    for (const p of footerPaths) {
      try { html = await loadFragment(p); break; } catch (e) { html = null; }
    }

    if (html) {
      // try to load icons and substitute placeholders
      try {
        const [homeSvg, itinerarySvg, searchSvg, budgetSvg, accountSvg] = await Promise.all([
          loadFragment(`${base}/assets/img/home.svg`),
          loadFragment(`${base}/assets/img/itinerary.svg`),
          loadFragment(`${base}/assets/img/search.svg`),
          loadFragment(`${base}/assets/img/budget.svg`),
          loadFragment(`${base}/assets/img/account.svg`),
        ]);
        html = html.replace('${HOME_ICON}', homeSvg)
                   .replace('${ITINERARY_ICON}', itinerarySvg)
                   .replace('${SEARCH_ICON}', searchSvg)
                   .replace('${BUDGET_ICON}', budgetSvg)
                   .replace('${ACCOUNT_ICON}', accountSvg);
      } catch (e) {
        // continue without icons
      }

      const device = document.querySelector('.device-iphone-16');
      if (device) {
        const temp = document.createElement('div'); temp.innerHTML = html;
        while (temp.firstChild) device.appendChild(temp.firstChild);
      } else {
        insertFooterToBody(html);
      }
    }
  } catch (err) {
    // fail silently
    console.warn('include.js:', err);
  }
})();