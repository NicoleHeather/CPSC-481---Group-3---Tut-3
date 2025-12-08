// script.js
const bookingRequestButton = document.getElementById('booking-request-btn');
const saveButton = document.getElementById('save-btn');
let exploreInfo = [];
let currentEvent;

// Get input fields from doc
const pageTitle = document.getElementById("page-title");
const pageDescription = document.getElementById("page-description")
const pageImage = document.getElementById("page-image");
const pageDate = document.getElementById("page-date");
const pageTime = document.getElementById("page-time");
const pageLocation = document.getElementById("page-location");
const pageCost = document.getElementById("page-cost")
const pageDuration = document.getElementById("page-duration");

document.addEventListener('DOMContentLoaded', function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    console.log(urlParams);

    const eventId = urlParams.get('id');
    console.log('Event ID:', eventId);

    fetch('../assets/data/events.json')
        .then(response => response.json())
        .then(response => {
            exploreInfo = response.explore;
            savedInfo = response.saved;

            console.log(exploreInfo);
            console.log(exploreInfo[0])

            console.log(savedInfo);
            console.log(savedInfo[0])

            for (let i = 0; i < exploreInfo.length; i++) {
                let tmp = exploreInfo[i];
                if (!tmp) continue;
                console.log(tmp.id);
                if (tmp.id == eventId){
                    currentEvent = tmp;
                    break;
                }
            }

            for (let j = 0; j < savedInfo.length; j ++){
                if (currentEvent != undefined && currentEvent != null){
                    break;
                }
                let tmp2 = savedInfo[j];
                if (!tmp2) continue;
                if (tmp2.id == eventId){
                    currentEvent = tmp2;
                    break;
                }
            }

            console.log(currentEvent);

            if (pageTitle && currentEvent && currentEvent.title) pageTitle.innerText = currentEvent.title;
            if (pageDescription && currentEvent && currentEvent.description) pageDescription.innerText = currentEvent.description;
            if (pageImage && currentEvent && currentEvent.img) pageImage.src = currentEvent.img;
            if (pageDate && currentEvent && currentEvent.date) pageDate.innerText = currentEvent.date;
            // Only populate page time if the element exists and is still empty/default to avoid
            // clobbering formatting applied by other page scripts that may run earlier/later.
            if (pageTime && currentEvent && currentEvent.time && (pageTime.textContent === '-' || pageTime.textContent.trim() === '')) {
                    // normalize and display as 12-hour with AM/PM
                    const t = String(currentEvent.time || '').trim();
                    function normalize24(tstr){ if (!tstr && tstr !== '') return ''; let s = String(tstr).trim(); if(!s) return ''; const mDigits = s.match(/^(\d{1,4})$/); if (mDigits){ const p = mDigits[1].padStart(4,'0'); let hh = parseInt(p.slice(0,2),10); const mm = p.slice(2); if(hh===24) hh=0; return `${String(hh).padStart(2,'0')}:${mm}`; } const m24 = s.match(/^(\d{1,2}):(\d{2})$/); if(m24){ let hh = parseInt(m24[1],10); const mm = m24[2]; if(hh===24) hh=0; return `${String(hh).padStart(2,'0')}:${mm}`; } const m12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i); if(m12){ let hh = parseInt(m12[1],10); const mm = m12[2]||'00'; const period = m12[3].toUpperCase(); if(period==='PM' && hh!==12) hh+=12; if(period==='AM' && hh===12) hh=0; return `${String(hh).padStart(2,'0')}:${mm}`; } return s; }
                    function to12Hour(t24){ if(!t24) return ''; const [hh,mm] = String(t24).split(':'); const h = Number(hh); const m = (mm||'00').padStart(2,'0'); const period = h>=12 ? 'PM':'AM'; const h12 = h%12||12; return `${h12}:${m} ${period}`; }
                    const start24 = normalize24(currentEvent.time);
                    // best-effort endTime from duration
                    function calculateEndTime24(startTime, duration){ if(!startTime || !duration) return ''; const [sh, sm] = startTime.split(':').map(Number); const total = sh*60 + sm + Math.round(parseFloat(duration)*60); const endH = Math.floor(total/60)%24; const endM = Math.floor(total%60); return `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`; }
                    const end24 = calculateEndTime24(start24, currentEvent.duration);
                        pageTime.innerText = end24 ? `${to12Hour(start24)} – ${to12Hour(end24)}` : to12Hour(start24);
            }
            if (pageLocation && currentEvent && currentEvent.location) pageLocation.innerText = currentEvent.location;

            if (pageCost) {
                if (currentEvent && currentEvent.price == undefined){
                    pageCost.innerText = "Free";
                }
                else if (currentEvent && currentEvent.price !== undefined) {
                    pageCost.innerText = currentEvent.price;
                }
            }

            if (pageDuration && currentEvent && currentEvent.duration !== undefined) {
                pageDuration.innerText = currentEvent.duration + " HR";
            }
        })
});


if (bookingRequestButton) {
    bookingRequestButton.addEventListener('click', function () {
        if (!currentEvent) return;
        console.log("Send data");
        console.log(currentEvent.id);
        // pass normalized 24-hour time in the query string
        function _normalize24(q){ if(!q && q!=='') return ''; let s=String(q).trim(); const mDigits=s.match(/^(\d{1,4})$/); if(mDigits){ const p=mDigits[1].padStart(4,'0'); let hh=parseInt(p.slice(0,2),10); const mm=p.slice(2); if(hh===24) hh=0; return `${String(hh).padStart(2,'0')}:${mm}`;} const m24=s.match(/^(\d{1,2}):(\d{2})$/); if(m24){ let hh=parseInt(m24[1],10); const mm=m24[2]; if(hh===24) hh=0; return `${String(hh).padStart(2,'0')}:${mm}`;} const m12=s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i); if(m12){ let hh=parseInt(m12[1],10); const mm=m12[2]||'00'; const period=m12[3].toUpperCase(); if(period==='PM' && hh!==12) hh+=12; if(period==='AM' && hh===12) hh=0; return `${String(hh).padStart(2,'0')}:${mm}`;} return s; }
        bookingRequestButton.href = `BookingRequest.html?date=${currentEvent.date}&time=${encodeURIComponent(_normalize24(currentEvent.time))}&title=${encodeURIComponent(currentEvent.title)}&id=${currentEvent.id}`;
    });
}
