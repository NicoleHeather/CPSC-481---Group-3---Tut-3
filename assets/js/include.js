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
    // If running from file:// and header partial couldn't be loaded, insert a minimal fallback header
    if (!html && window.location.protocol === 'file:') {
      const simpleHeader = `
        <header class="site-header">
          <div class="container">
            <a class="brand" href="${base}/pages/Home.html">My Events</a>
            <nav class="simple-nav">
              <a href="${base}/pages/Search.html">Search</a>
              <a href="${base}/pages/EventBooking.html">Bookings</a>
              <a href="${base}/pages/AccountSettings.html">Account</a>
            </nav>
          </div>
        </header>
      `;
      insertAtBodyStart(simpleHeader);
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
    // If running from file:// and footer partial couldn't be loaded, insert a minimal fallback footer
    if (!html && window.location.protocol === 'file:') {
      const simpleFooter = `
        <footer class="site-footer">
          <div class="container">
            <p>© ${new Date().getFullYear()} My Events • <a href="${base}/pages/Contact.html">Contact</a></p>
          </div>
        </footer>
      `;
      insertFooterToBody(simpleFooter);
    }
  } catch (err) {
    // fail silently
    console.warn('include.js:', err);
  }
})();