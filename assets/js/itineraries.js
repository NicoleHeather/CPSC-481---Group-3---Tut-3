document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('itineraries-grid');
  if (!container) return;
  const modalsRoot = document.getElementById('modals');
  const toastRoot = document.getElementById('toast-container');
  const addTripBtn = document.getElementById('add-trip-btn');

  // Load trips + events so we can show sample events on each card
  Promise.all([
    fetch('../assets/data/trips.json').then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
    fetch('../assets/data/events.json').then(r => r.ok ? r.json() : Promise.reject(r.statusText))
  ])
    .then(([tripsData, eventsData]) => {
      const trips = (tripsData && tripsData.trips) || [];
      const allEvents = (eventsData && (eventsData.explore || [])).concat((eventsData && eventsData.saved) || []) || [];
      // Load local overrides / extras / deleted lists from localStorage
      const KEY_EXTRAS = 'itineraries.extras';
      const KEY_DELETED = 'itineraries.deleted';
      const KEY_OVERRIDES = 'itineraries.overrides';

      function loadJSON(key){ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }catch(e){return null;} }
      function saveJSON(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }

      const extras = loadJSON(KEY_EXTRAS) || [];
      const deleted = new Set((loadJSON(KEY_DELETED) || []));
      const overrides = loadJSON(KEY_OVERRIDES) || {};

      // Merge fetched trips with extras and apply overrides; filter deleted
      let merged = trips.concat(extras.map(t=>Object.assign({isExtra:true}, t)));
      merged = merged.filter(t => !deleted.has(t.id));
      merged = merged.map(t => overrides[t.id] ? Object.assign({}, t, overrides[t.id]) : t);

      // Expose merged itineraries globally for other scripts
      window.mergedItineraries = merged;

      if (!merged.length) {
        container.innerHTML = '<p>No itineraries found.</p>';
        return;
      }

      // Helpers
      const randInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
      const parseISO = (d) => new Date(d + 'T00:00:00');
      const randomDateBetween = (startIso,endIso) => {
        const s = parseISO(startIso); const e = parseISO(endIso);
        const diff = e.getTime() - s.getTime();
        const t = s.getTime() + Math.floor(Math.random() * (diff+1));
        return new Date(t).toISOString().slice(0,10);
      };

      function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=randInt(0,i); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

      merged.forEach(trip => {
        const link = trip.link || '#';
        const img = (trip.images && trip.images[0]) || '';

        // create wrapper so the budget control can be a sibling (not nested interactive inside anchor)
        const wrapper = document.createElement('div');
        wrapper.className = 'itinerary-card';

        const a = document.createElement('a');
        a.className = 'event-card';
        // Open the custom week view for this trip (bookmarkable)
        a.href = `../pages/ItineraryWeek.html?trip=${encodeURIComponent(trip.id || '')}`;
        a.setAttribute('role', 'group');
        a.setAttribute('aria-label', trip.title || 'Itinerary');
        if (img) {
          a.style.backgroundImage = `url(${img})`;
        } else {
          /* Very light orange fallback using brand accent hues */
          a.style.backgroundImage = 'linear-gradient(180deg, rgba(255,127,39,0.06), rgba(255,127,39,0.02))';
          a.style.backgroundColor = '#fff8f3';
        }

        // optional price badge (kept conditional but usually not used for itineraries)
        if (trip.price) {
          const price = document.createElement('div');
          price.className = 'price-badge';
          price.textContent = `$${trip.price}`;
          a.appendChild(price);
        }

        const overlay = document.createElement('div');
        overlay.className = 'event-card__overlay';

        const title = document.createElement('h3');
        title.className = 'event-card__title';
        // Show the trip title as the bold headline (e.g., "Calgary"); fall back to location if title missing
        title.textContent = trip.title || trip.location || '';
        overlay.appendChild(title);

        const subtitle = document.createElement('p');
        subtitle.className = 'event-card__subtitle';
        // subtitle: only the date range (non-bold), placed under the title
        if (trip.startDate && trip.endDate) {
          const sDate = parseISO(trip.startDate); // use local-midnight parse to avoid TZ shifting a day
          const eDate = parseISO(trip.endDate);
          const sameYear = sDate.getFullYear() === eDate.getFullYear();
          const s = sDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (sameYear ? '' : ` ${sDate.getFullYear()}`);
          const e = eDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          subtitle.textContent = `${s} — ${e}`;
        } else {
          subtitle.textContent = '';
        }
        overlay.appendChild(subtitle);
        // Previously we inserted a small list of sample events into each
        // itinerary card as a preview. That caused unwanted event previews
        // to appear on the Itineraries page. Remove the mini-list so cards
        // only show the trip title and date range.
        a.appendChild(overlay);

        // assemble wrapper
        wrapper.appendChild(a);

        // Kebab (meatballs) menu: render button inside the card overlay at top-right
        const kebabBtn = document.createElement('button');
        kebabBtn.type = 'button';
        kebabBtn.className = 'btn-accent-outline kebab-btn';
        kebabBtn.setAttribute('aria-expanded', 'false');
        kebabBtn.setAttribute('aria-label', `Open actions for ${trip.title || 'itinerary'}`);
        // Use three bold filled dots for a stronger meatballs visual
        kebabBtn.innerHTML = '&#x25CF;&nbsp;&#x25CF;&nbsp;&#x25CF;';

        const menu = document.createElement('div');
        menu.className = 'kebab-menu';
        menu.setAttribute('role', 'menu');

        const mEdit = document.createElement('button'); mEdit.type='button'; mEdit.textContent='Edit'; mEdit.setAttribute('role','menuitem');
        const mDelete = document.createElement('button'); mDelete.type='button'; mDelete.textContent='Delete'; mDelete.setAttribute('role','menuitem');
        const mShare = document.createElement('button'); mShare.type='button'; mShare.textContent='Share'; mShare.setAttribute('role','menuitem');
        menu.appendChild(mEdit); menu.appendChild(mDelete); menu.appendChild(mShare);

        // place kebab button and menu inside the overlay so it overlays the image
        overlay.appendChild(kebabBtn);
        overlay.appendChild(menu);

        // Maintain existing Manage Budget tab for parity (rendered under the card)
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.marginTop = '0';
        actions.style.justifyContent = 'flex-start';

        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'itinerary-card__tab';
        tab.setAttribute('aria-label', `Manage budget for ${trip.title || 'itinerary'}`);
        tab.dataset.tripId = trip.id || '';
        tab.textContent = 'Manage Budget';
        tab.addEventListener('click', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          location.href = `../pages/Budget.html?trip=${encodeURIComponent(trip.id)}`;
        });

        wrapper.appendChild(actions);
        wrapper.appendChild(tab);
        container.appendChild(wrapper);

        // Kebab menu behavior
        function closeMenu(){ menu.classList.remove('visible'); kebabBtn.setAttribute('aria-expanded','false'); }
        function openMenu(){ menu.classList.add('visible'); kebabBtn.setAttribute('aria-expanded','true'); const btn = menu.querySelector('button'); if(btn) btn.focus(); }

        kebabBtn.addEventListener('click', (e)=>{ e.stopPropagation(); e.preventDefault(); if(menu.classList.contains('visible')) closeMenu(); else openMenu(); });

        // menu item handlers
        mEdit.addEventListener('click', (e)=>{ e.stopPropagation(); e.preventDefault(); closeMenu(); openEditModal(trip); });
        mDelete.addEventListener('click', (e)=>{ e.stopPropagation(); e.preventDefault(); closeMenu(); confirmDelete(trip); });
        mShare.addEventListener('click', (e)=>{ e.stopPropagation(); e.preventDefault(); closeMenu(); shareTrip(trip); });

        // close on outside click
        document.addEventListener('click', (ev)=>{ if(!overlay.contains(ev.target)) closeMenu(); });
        document.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape') closeMenu(); });
      });

      // Wire Add Trip button
      if (addTripBtn) addTripBtn.addEventListener('click', ()=> openAddModal());

      // --- helper functions: modals, add/edit/delete, toast/undo ---
      function openAddModal(){
        const modal = createTripForm(null, (newTrip)=>{
          // ensure id
          if(!newTrip.id) newTrip.id = `trip-${Date.now()}`;
          extras.unshift(newTrip);
          saveJSON(KEY_EXTRAS, extras);
          location.reload();
        });
        modalsRoot.appendChild(modal);
      }

      function openEditModal(trip){
        const modal = createTripForm(trip, (updated)=>{
          // if trip is an extra, update extras; otherwise add to overrides
          if(trip.isExtra){
            const idx = extras.findIndex(x=>x.id===trip.id);
            if(idx>=0){ extras[idx] = Object.assign({}, extras[idx], updated); saveJSON(KEY_EXTRAS, extras); }
          } else {
            overrides[trip.id] = Object.assign({}, overrides[trip.id]||{}, updated);
            saveJSON(KEY_OVERRIDES, overrides);
          }
          location.reload();
        });
        modalsRoot.appendChild(modal);
      }

      function confirmDelete(trip){
        const performDelete = ()=>{
          if(trip.isExtra){
            const idx = extras.findIndex(x=>x.id===trip.id);
            if(idx>=0) { const removed = extras.splice(idx,1)[0]; saveJSON(KEY_EXTRAS, extras); showUndoToast('Trip removed', ()=>{ extras.splice(idx,0,removed); saveJSON(KEY_EXTRAS, extras); location.reload(); }); }
          } else {
            const arr = loadJSON(KEY_DELETED) || [];
            arr.push(trip.id);
            saveJSON(KEY_DELETED, arr);
            showUndoToast('Trip deleted', ()=>{ const cur = loadJSON(KEY_DELETED)||[]; const i = cur.indexOf(trip.id); if(i>=0) cur.splice(i,1); saveJSON(KEY_DELETED, cur); location.reload(); });
          }
          location.reload();
        };
        showDeleteItineraryModal(trip.title || 'itinerary', performDelete);
      }

      // Styled delete confirmation modal for itineraries page
      let _delModal = null;
      let _delCallback = null;
      function ensureDeleteItineraryModal(){
        if (_delModal) return _delModal;
        const overlay = document.createElement('div'); overlay.className = 'cd-overlay'; overlay.style.display='none';
        const modal = document.createElement('div'); modal.className = 'cd-modal';
        modal.innerHTML = `
          <div class="cd-header">
            <h2>Delete Itinerary</h2>
          </div>
          <div class="cd-body">
            <p>This will remove <span class="cd-itinerary-name"></span> from your itineraries on this device.</p>
            <p>This action cannot be undone.</p>
          </div>
          <div class="cd-footer">
            <button type="button" class="cd-cancel btn">Cancel</button>
            <button type="button" class="cd-confirm btn btn-danger">Delete</button>
          </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const cancelBtn = modal.querySelector('.cd-cancel');
        const confirmBtn = modal.querySelector('.cd-confirm');
        cancelBtn.addEventListener('click', ()=>{ overlay.style.display='none'; });
        confirmBtn.addEventListener('click', ()=>{ if(_delCallback) _delCallback(); overlay.style.display='none'; });
        overlay.addEventListener('click', (e)=>{ if(e.target === overlay){ overlay.style.display='none'; } });

        _delModal = overlay;
        return _delModal;
      }
      function showDeleteItineraryModal(name, onConfirm){
        const m = ensureDeleteItineraryModal();
        _delCallback = onConfirm;
        const nameEl = m.querySelector('.cd-itinerary-name');
        if (nameEl) nameEl.textContent = `"${name}"`;
        m.style.display = 'flex';
        const confirmBtn = m.querySelector('.cd-confirm');
        if (confirmBtn) confirmBtn.focus();
      }

      function createTripForm(existing, onSave){
        // Modal using global site styles: .modal, .modal-backdrop, .modal-panel
        const wrapper = document.createElement('div');
        wrapper.className = 'modal';
        wrapper.setAttribute('role','dialog');
        wrapper.setAttribute('aria-modal','true');

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';

        const panel = document.createElement('div');
        panel.className = 'modal-panel';
        panel.setAttribute('role','document');

        // Header
        const header = document.createElement('div'); header.className = 'modal-header';
        const h2 = document.createElement('h2'); h2.textContent = existing ? 'Edit Itinerary' : 'Add Itinerary';
        header.appendChild(h2);

        // Body with form-group semantics to reuse main.css styles
        const body = document.createElement('div'); body.className = 'modal-body';
        const form = document.createElement('form');
        form.innerHTML = `
          <div class="settings-section" style="padding:12px; box-shadow:none; border:none;">
            <div class="form-group">
              <label>Title</label>
              <input name="title" value="${existing?existing.title||'' : ''}" required />
            </div>
            <div class="form-group">
              <label>Start Date</label>
              <input name="startDate" type="date" value="${existing?existing.startDate||'' : ''}" required />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input name="endDate" type="date" value="${existing?existing.endDate||'' : ''}" required />
            </div>
            <div class="form-actions">
              <button type="button" class="btn-cancel cancel">Cancel</button>
              <button type="submit" class="btn">Save</button>
            </div>
          </div>
        `;

        body.appendChild(form);

        // Assemble and show (use .open / aria-hidden so CSS displays the modal)
        panel.appendChild(header);
        panel.appendChild(body);
        wrapper.appendChild(backdrop);
        wrapper.appendChild(panel);
        wrapper.classList.add('open');
        wrapper.setAttribute('aria-hidden', 'false');

        // Focus management
        setTimeout(()=>{ const first = form.querySelector('input[name="title"]'); if(first) first.focus(); }, 20);

        // Handlers
        const cancelBtn = form.querySelector('.cancel');
        cancelBtn.addEventListener('click', ()=> wrapper.remove());

        form.addEventListener('submit', (e)=>{
          e.preventDefault();
          const fd = new FormData(form);
          const t = (fd.get('title')||'').trim();
          const s = fd.get('startDate');
          const en = fd.get('endDate');
          if(!t || !s || !en){ alert('Please fill all fields'); return; }

          const proceed = ()=>{
            const out = { title: t, startDate: s, endDate: en };
            if(existing && existing.id) out.id = existing.id;
            wrapper.remove();
            onSave(out);
          };

          // If editing and shrinking the date range, warn if stored events would be lost
          if (existing && existing.id) {
            const prevStart = parseISO(existing.startDate || s);
            const prevEnd = parseISO(existing.endDate || en);
            const newStart = parseISO(s);
            const newEnd = parseISO(en);
            if (newStart > prevStart || newEnd < prevEnd) {
              // load any cached events for this trip (from week/day views)
              let savedEvents = [];
              // consider both legacy key shapes
              const keys = [`events-${existing.id}`, `events.${existing.id}`];
              keys.forEach((k)=>{
                try {
                  const raw = localStorage.getItem(k);
                  if (raw) savedEvents = savedEvents.concat(JSON.parse(raw) || []);
                } catch(e) { /* ignore bad parse */ }
              });

              // For new itineraries, always start with an empty event list
              let candidates = existing && existing.id ? savedEvents : [];
              const toLose = candidates.filter(ev => {
                if (!ev || !ev.date) return false;
                const d = parseISO(ev.date);
                return d < newStart || d > newEnd;
              });
              if (toLose.length > 0) {
                showItineraryDateChangeModal(toLose.length, proceed);
                return;
              }
            }
          }

          proceed();
        });

        // Close modal on backdrop click or Escape
        backdrop.addEventListener('click', ()=> wrapper.remove());
        document.addEventListener('keydown', function escHandler(ev){ if(ev.key==='Escape'){ wrapper.remove(); document.removeEventListener('keydown', escHandler); } });

        return wrapper;
      }

      // Styled confirmation modal mirroring weekly view
      let _itModal = null;
      let _itCallback = null;
      function ensureItineraryDateChangeModal(){
        if (_itModal) return _itModal;
        const overlay = document.createElement('div'); overlay.className = 'cdc-overlay'; overlay.style.display='none';
        const modal = document.createElement('div'); modal.className = 'cdc-modal';
        modal.innerHTML = `
          <div class="cdc-header">
            <h2>Events Will Be Removed</h2>
          </div>
          <div class="cdc-body">
            <p>Changing the dates will remove <span class="cdc-event-count"></span> event(s) that fall outside the new date range.</p>
            <p>Continue anyway?</p>
          </div>
          <div class="cdc-footer">
            <button type="button" class="cdc-cancel btn">Cancel</button>
            <button type="button" class="cdc-confirm btn">Remove Events & Update Dates</button>
          </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const cancelBtn = modal.querySelector('.cdc-cancel');
        const confirmBtn = modal.querySelector('.cdc-confirm');
        cancelBtn.addEventListener('click', ()=>{ overlay.style.display='none'; });
        confirmBtn.addEventListener('click', ()=>{ if(_itCallback) _itCallback(); overlay.style.display='none'; });

        _itModal = overlay;
        return _itModal;
      }
      function showItineraryDateChangeModal(count, onConfirm){
        const m = ensureItineraryDateChangeModal();
        _itCallback = onConfirm;
        m.querySelector('.cdc-event-count').textContent = count;
        m.style.display = 'flex';
        const confirmBtn = m.querySelector('.cdc-confirm');
        if (confirmBtn) confirmBtn.focus();
      }

      function showUndoToast(msg, onUndo){
        const box = document.createElement('div'); box.className='toast'; box.style.background='#111'; box.style.color='#fff'; box.style.padding='10px 12px'; box.style.borderRadius='8px'; box.style.marginTop='8px'; box.style.display='flex'; box.style.alignItems='center'; box.style.gap='12px';
        const span = document.createElement('div'); span.textContent = msg; box.appendChild(span);
        const undo = document.createElement('button'); undo.className='btn-accent-outline'; undo.textContent='Undo'; undo.addEventListener('click', ()=>{ try{ onUndo(); }catch(e){} finally{ box.remove(); } });
        box.appendChild(undo);
        toastRoot.appendChild(box);
        setTimeout(()=>{ try{ box.remove(); }catch(e){} }, 6000);
      }

      // Share helper: navigate to Share.html with trip parameter
      function shareTrip(trip){
        location.href = `../pages/Share.html?trip=${encodeURIComponent(trip.id)}`;
      }
    })
    .catch(err => {
      console.error('Failed to load trips:', err);
      const container = document.getElementById('itineraries-grid');
      if (container) container.innerHTML = '<p>Could not load itineraries.</p>';
    });
});
