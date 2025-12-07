
# Prototype: Trip Management System for Calgary (HTML/CSS/JS)

This is a small static prototype demonstrating a mobile-first UI built with plain HTML, CSS and vanilla JavaScript. It includes a header/footer partial system, a mock JSON data file (with an inline fallback), and a simple bottom navigation.

# Recommended setup (developer)

- Recommended editor: Visual Studio Code
- Recommended terminal on Windows: PowerShell (or Command Prompt). macOS/Linux users can use Terminal or their preferred shell.
- Note: command examples in this README use Windows/PowerShell paths and syntax; adapt the paths/commands as needed for other OSes.

## Quick start (Windows PowerShell)

1. Open PowerShell or Command Prompt and go to the repo root. Example:

```powershell
git clone https://github.com/NicoleHeather/CPSC-481---Group-3---Tut-3.git
cd /<yourpath>/<to>/CPSC-481---Group-3---Tut-3
```

2. To view the app correctly, run a local static server (this ensures network requests succeed). 
    Two easy options:

        - With Node:

        ```powershell
        npx http-server . -p 3000
        # open http://localhost:3000/
        ```

        - With Python 3:

        ```powershell
        python -m http.server 3000
        # open http://localhost:3000/
        ```
        
### Preview with Chrome DevTools (iPhone 16 dimensions)

To mimic an iPhone 16 viewport in Chrome's DevTools:

1. Open the app in Chrome (for example: http://localhost:3000/).
2. Open DevTools (Ctrl+Shift+I or F12).
3. Toggle the Device Toolbar (Ctrl+Shift+M) to enable responsive/mobile preview.
4. In the device toolbar's device dropdown, choose "Edit" → "Add custom device" (or choose "Responsive"). Create a device with these values:
	- Device name: iPhone 16
	- Width: 393
	- Height: 852
	- Device pixel ratio (DPR): 3 (optional)
	- User agent string: leave default or choose an iPhone-like UA
5. Select your new "iPhone 16" device from the list. DevTools will resize the viewport to 393×852.
6. Hard-reload the page (Right-click refresh → "Empty Cache and Hard Reload") so CSS and JS load correctly in the emulated device mode.


## Project structure

- `index.html` — top-level entry that loads global CSS and the JS injector.
- `pages/` — standalone HTML views used for navigation (e.g., `Home.html`, `EventInfo.html`). These pages load the partials via `assets/js/include.js`.
- `partials/` — shared fragments injected at runtime:
	- `header.html` — app header (left/right buttons and brand)
	- `footer.html` — footer + bottom navigation (icon placeholders replaced at runtime)
- `assets/css/` — styling tokens and main CSS
	- `variables.css` — theme variables (colors, radius, spacing)
	- `main.css` — global styles, header/footer, bottom-nav
- `assets/js/` — client scripts
	- `include.js` — loads and injects `partials/*.html` and substitutes icon placeholders with `assets/img/*.svg` contents
	- `main.js` — page-level UI logic; attempts to fetch `assets/data/mock.json` but falls back to an inline `FALLBACK_DATA` so pages still render without a server
- `assets/data/mock.json` — optional editable mock data for lists (kept to allow easy editing of example content)
- `assets/img/*.svg` — SVG icons used by the bottom navigation and header

## How partial injection works

`assets/js/include.js` runs early in the page lifecycle and:
- fetches `partials/header.html` and `partials/footer.html`
- in the footer it replaces tokens like `${HOME_ICON}` with the contents of `assets/img/home.svg` (so icons are inlined and styleable)
- inserts the fragments into the page DOM

This keeps pages small and ensures the header/footer is consistent across views.

## Mock data behavior

`assets/js/main.js` will try to fetch `assets/data/mock.json` relative to the current page. If the fetch fails (for example when opened over `file://`), the script uses an inline `FALLBACK_DATA` so the UI still renders. Edit `assets/data/mock.json` to change example content when serving over HTTP.

## Local testing tips

- Use the browser's responsive/devtools to preview mobile widths.
- Hard-reload (Ctrl+F5) after CSS changes to avoid cached assets.
- If icons don't appear, verify `assets/img/*.svg` files are present and `partials/footer.html` includes the `${..._ICON}` tokens.