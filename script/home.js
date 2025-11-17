import { db } from "./firebase.js";
import {
  collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');

burger.addEventListener('click', () => {
  navLinks.classList.toggle('active');  
  burger.classList.toggle('toggle');   
});


const announcementsContainer = document.getElementById("announcements");
const eventsContainer = document.getElementById("events");
const hotlinesContainer = document.getElementById("hotlines");
const calendarGrid = document.querySelector('.calendar-grid');
const monthYearLabel = document.getElementById('calendar-month-year');
const docSlider = document.getElementById("doc-slider");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");


let calendarEvents = [];


function fetchPosts(type, container) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    container.innerHTML = "";
    const filtered = snapshot.docs.filter(doc => doc.data().type === type);

    if (filtered.length === 0) {
      container.innerHTML = `<p>No ${type}s yet.</p>`;
      return;
    }

    filtered.forEach((doc) => {
      const d = doc.data();
      const div = document.createElement("div");
      div.classList.add("announcement-item");

      const maxLength = 120;
      const shortDesc = d.description.length > maxLength
        ? d.description.substring(0, maxLength) + "…"
        : d.description;

      div.innerHTML = `
        ${d.imageUrl ? `<img src="${d.imageUrl}" class="announcement-img" />` : ""}
        <h1>${d.title}</h1>
        <p>${shortDesc}</p>
        <small>${d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : ""}</small>
        <hr>
      `;

      div.addEventListener("click", () => openPostModal(d));
      container.appendChild(div);
    });
  }, (error) => {
    console.error(`Error fetching ${type}:`, error);
    container.innerHTML = `<p>Error loading ${type}s.</p>`;
  });
}

/* -----------------------------
   Open Post Modal
------------------------------ */
function openPostModal(data) {
  const overlay = document.createElement("div");
  overlay.classList.add("post-modal-overlay");
  overlay.innerHTML = `
    <div class="post-modal">
      <span class="close-modal">&times;</span>
      ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.title}">` : ""}
      <h2>${data.title}</h2>
      <p>${data.description}</p>
      <small>${data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : ""}</small>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector(".close-modal").onclick = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

/* -----------------------------
   Fetch Documentations Slider
------------------------------ */
function fetchDocumentations() {
  if (!docSlider) return;

  const q = query(collection(db, "documentations"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    docSlider.innerHTML = "";

    if (snapshot.empty) {
      docSlider.innerHTML = `<p>No documentation images uploaded yet.</p>`;
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const slide = document.createElement("div");
      slide.classList.add("card-slide");
      slide.innerHTML = `<img src="${data.imageUrl}" alt="Documentation">`;
      docSlider.appendChild(slide);
    });

    initSlider();
  }, (error) => {
    console.error("Error fetching documentations:", error);
    docSlider.innerHTML = `<p>Error loading documentation.</p>`;
  });
}

/* -----------------------------
   Slider Function
------------------------------ */
function initSlider() {
  const slides = document.querySelectorAll(".card-slide");
  if (slides.length === 0) return;

  let current = 0;

  function updateSlides() {
    slides.forEach((slide, i) => {
      slide.classList.remove("active", "prev", "next");
      if (i === current) slide.classList.add("active");
      else if (i === (current - 1 + slides.length) % slides.length) slide.classList.add("prev");
      else if (i === (current + 1) % slides.length) slide.classList.add("next");
    });
  }

  nextBtn && (nextBtn.onclick = () => {
    current = (current + 1) % slides.length;
    updateSlides();
  });

  prevBtn && (prevBtn.onclick = () => {
    current = (current - 1 + slides.length) % slides.length;
    updateSlides();
  });

  setInterval(() => {
    current = (current + 1) % slides.length;
    updateSlides();
  }, 4000);

  updateSlides();
}

/* -----------------------------
   Tab Switching
------------------------------ */
const tabButtons = document.querySelectorAll(".banner-button");
const tabPanes = document.querySelectorAll(".tab-pane");

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabPanes.forEach(p => p.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

/* -----------------------------
   Fetch Hotlines
------------------------------ */
function fetchHotlines() {
  hotlinesContainer.innerHTML = `<div class="hotline-container"></div>`;
  const container = hotlinesContainer.querySelector(".hotline-container");

  const hotlineData = [
    { title: "Gender-Related Hotlines", list: [
      { name: "PCW", number: "0919-333-4455" },
      { name: "DSWD Women’s Desk", number: "(02) 931-8101" },
      { name: "PNP Women & Children", number: "(02) 8536-6532" }
    ]},
    { title: "PWD Assistance", list: [
      { name: "NCDA", number: "(02) 932-6422" },
      { name: "DOH Disability Unit", number: "(02) 651-7800" }
    ]},
    { title: "General Concerns", list: [
      { name: "Emergency", number: "911" },
      { name: "DOH COVID-19", number: "1555" },
      { name: "DSWD Hotline", number: "8888" }
    ]}
  ];

  hotlineData.forEach(h => {
    const card = document.createElement("div");
    card.classList.add("hotline-card");
    let html = `<h3>${h.title}</h3><ul>`;
    h.list.forEach(item => html += `<li><strong>${item.name}:</strong> ${item.number}</li>`);
    html += `</ul>`;
    card.innerHTML = html;
    container.appendChild(card);
  });
}

/* -----------------------------
   Calendar Logic (with weekday header)
------------------------------ */
let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

function fetchCalendarEvents() {
  const q = query(collection(db, "calendarActivities"), orderBy("date", "asc"));
  onSnapshot(q, (snapshot) => {
    calendarEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderCalendar(currentMonth, currentYear);
  }, (error) => {
    console.error("Error fetching calendar events:", error);
  });
}

/* -----------------------------
   UPDATED: Calendar Rendering + Weekday Header
------------------------------ */
function renderCalendar(month, year) {
  if (!calendarGrid || !monthYearLabel) return;

  calendarGrid.innerHTML = "";

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month));
  monthYearLabel.textContent = `${monthName} ${year}`;

  /* WEEKDAY HEADERS */
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  daysOfWeek.forEach(day => {
    const div = document.createElement("div");
    div.classList.add("calendar-weekday");
    div.textContent = day;
    calendarGrid.appendChild(div);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.classList.add("calendar-day", "inactive");
    calendarGrid.appendChild(empty);
  }

  for (let i = 1; i <= lastDate; i++) {
    const day = document.createElement("div");
    day.classList.add("calendar-day");
    day.textContent = i;

    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      day.classList.add("today");
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const dayEvents = calendarEvents.filter(ev => ev.date === dateStr);

    dayEvents.forEach(ev => {
      const evDiv = document.createElement("div");
      evDiv.classList.add("calendar-event");
      evDiv.textContent = ev.title;
      day.appendChild(evDiv);
    });

    if (dayEvents.length > 0) {
      day.style.cursor = "pointer";
      day.addEventListener("click", () => openCalendarModal(dayEvents));
    }

    calendarGrid.appendChild(day);
  }
}

function openCalendarModal(events) {
  const overlay = document.createElement("div");
  overlay.classList.add("calendar-modal-overlay");
  overlay.style = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex; justify-content: center; align-items: center;
    z-index: 9999;
  `;

  const modal = document.createElement("div");
  modal.style = `
    background: #fff; border-radius: 10px; padding: 20px;
    width: 90%; max-width: 600px; max-height: 80vh;
    overflow-y: auto; position: relative;
  `;

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "&times;";
  closeBtn.style = `
    position: absolute; top: 10px; right: 20px;
    font-size: 28px; cursor: pointer; font-weight: bold;
  `;

  modal.appendChild(closeBtn);

  events.forEach(ev => {
    const evDiv = document.createElement("div");
    evDiv.style.marginBottom = "20px";
    evDiv.innerHTML = `
      ${ev.imageUrl ? `<img src="${ev.imageUrl}" style="width:100%; border-radius:8px;">` : ""}
      <h2>${ev.title}</h2>
      <p>${ev.description}</p>
      <small>${ev.date}</small>
      <hr>
    `;
    modal.appendChild(evDiv);
  });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  closeBtn.onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

/* -----------------------------
   Calendar Navigation
------------------------------ */
document.getElementById("prev-month")?.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar(currentMonth, currentYear);
});

document.getElementById("next-month")?.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar(currentMonth, currentYear);
});

/* -----------------------------
   Initialize All
------------------------------ */
renderCalendar(currentMonth, currentYear);
fetchPosts("announcement", announcementsContainer);
fetchPosts("event", eventsContainer);
fetchDocumentations();
fetchHotlines();
fetchCalendarEvents();
