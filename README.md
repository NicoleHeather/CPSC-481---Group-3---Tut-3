Tut3 Prototype (HTML/CSS/JS)

Structure
- index.html: main entry page with simple nav and sample content.
- pages/: static HTML pages for the prototype (Home.html, EventInfo.html, ...).
- assets/css/: CSS variables and main stylesheet.
- assets/js/: small vanilla JS for interactivity (includes inline mock data and will fetch `assets/data/mock.json` if available).
- assets/data/: optional mock JSON used to prototype lists (kept for editable data).

How to run
- Open `index.html` in your browser (no server required). The prototype uses inline mock data so it works by double-clicking the HTML files. If `assets/data/mock.json` is present and the site is served over HTTP, the script will fetch it instead.
- If you want to exercise network fetches, run a local static server (e.g., `python -m http.server` in the repo root).

Conventions
- Keep CSS variables in `variables.css` and shared styles in `main.css`.
- Use semantic HTML and small components (cards, buttons).
- Keep JS vanilla and modular; no build tools.
