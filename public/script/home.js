// Create loader dynamically
const loader = document.createElement('div');
loader.id = 'loader';
loader.className = 'loader-overlay';
loader.innerHTML = '<div class="spinner"></div>';
document.body.appendChild(loader);

// Reference to your content container
const content = document.getElementById('content'); // make sure your content container exists

// Show/hide functions
function showLoader() {
  loader.style.display = 'flex';
  if(content) content.style.display = 'none';
}

function hideLoader() {
  loader.style.display = 'none';
  if(content) content.style.display = 'block';
}


import { db } from "./firebase.js";
import { 
  collection, query, orderBy, onSnapshot, doc, getDoc, where, limit, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded ✅");

  // Navigation burger menu
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('active');  
      burger.classList.toggle('toggle');   
    });
  }

  // Load main data
  await fetchBanner();
  await loadCampaignThemePublic();

  fetchPosts("announcement", document.getElementById("announcements"));
  fetchPosts("event", document.getElementById("events"));
  fetchDocumentations();
  fetchHotlines();
  fetchCalendarEvents();

  // Load resources
await loadResource("accomplishmentReports", "acc-grid");
await loadResource("specialOrders", "so-grid");
await loadResource("gadLaws", "gad-grid");
await loadResource("dswdAgenda", "dswd-grid");
await loadResource("genderlaws", "gl-grid");

});

/* -----------------------------
   Banner
------------------------------ */
async function fetchBanner() {
  const bannerImg = document.getElementById("home-banner");
  if (!bannerImg) return;

  try {
    const bannerSnap = await getDoc(doc(db, "banners", "site-banner"));
    bannerImg.src = bannerSnap.exists() ? bannerSnap.data().imageUrl || "images/4ft x 11ft Streamer.png" : "images/4ft x 11ft Streamer.png";
  } catch (err) {
    console.error("Error fetching banner:", err);
    bannerImg.src = "images/4ft x 11ft Streamer.png";
  }
}

/* -----------------------------
   Campaign Theme
------------------------------ */
async function loadCampaignThemePublic() {
  try {
    const themeDocSnap = await getDoc(doc(db, "siteSettings", "campaignTheme"));
    if (!themeDocSnap.exists()) return;

    const data = themeDocSnap.data();
    const titleEl = document.getElementById("campaign-title");
    const descEl = document.getElementById("campaign-description");
    const imageEl = document.getElementById("campaign-image");

    if (titleEl) titleEl.textContent = data.title || "";
    if (descEl) descEl.innerHTML = data.description ? data.description.replace(/\n/g, "<br>") : "";
    if (imageEl) imageEl.src = data.imageUrl || "";
  } catch (err) {
    console.error("Error loading campaign theme:", err);
  }
}

/* -----------------------------
   Load Resources
------------------------------ */
async function loadResource(type, containerId) {
  try {
    const qRes = query(
      collection(db, "resources"), 
      where("type", "==", type), 
      orderBy("createdAt", "desc") // no limit
    );
    const snap = await getDocs(qRes);
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ""; // clear old content

    if (snap.empty) {
      return;
    }

    snap.docs.forEach(doc => {
      const data = doc.data();

      const card = document.createElement("div");
      card.className = "section-box"; // your GAD card design
      card.innerHTML = `
        <h3>${data.title || ""}</h3>
        <p>${data.description || ""}</p>
        <a href="${data.fileUrl || "#"}" target="_blank">Read More</a>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error(`Error loading resources of type "${type}":`, err);
  }
}


function fetchPosts(type, container) {
  if (!container) return;
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
      const shortDesc = d.description.length > maxLength ? d.description.substring(0, maxLength) + "…" : d.description;

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
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}

/* -----------------------------
   Documentation Slider
------------------------------ */
const docSlider = document.getElementById("doc-slider");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

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

function initSlider() {
  const slides = document.querySelectorAll(".card-slide");
  if (!slides.length) return;

  let current = 0;
  const updateSlides = () => {
    slides.forEach((slide, i) => {
      slide.classList.remove("active", "prev", "next");
      if (i === current) slide.classList.add("active");
      else if (i === (current - 1 + slides.length) % slides.length) slide.classList.add("prev");
      else if (i === (current + 1) % slides.length) slide.classList.add("next");
    });
  };

  nextBtn && (nextBtn.onclick = () => { current = (current + 1) % slides.length; updateSlides(); });
  prevBtn && (prevBtn.onclick = () => { current = (current - 1 + slides.length) % slides.length; updateSlides(); });

  setInterval(() => { current = (current + 1) % slides.length; updateSlides(); }, 4000);
  updateSlides();
}

// Function to fetch and display hotlines from Firestore
async function fetchHotlines() {
  const hotlinesContainer = document.querySelector("#hotlines .hotline-container");
  if (!hotlinesContainer) return;

  hotlinesContainer.innerHTML = ""; // Clear any existing hotlines

  try {
    // Query to fetch hotlines from Firestore, ordered by category
    const q = query(collection(db, "hotlines"), orderBy("category"));
    const snapshot = await getDocs(q);

    // Iterate through the documents and add them to the container
    snapshot.forEach(doc => {
      const data = doc.data();
      const hotlineCard = document.createElement("div");
      hotlineCard.classList.add("hotline-card");

      // Create the HTML structure for each hotline
      hotlineCard.innerHTML = `
        <h3>${data.category}</h3>
        <ul>
          <li>
            <strong>${data.name}:</strong> ${data.number}
          </li>
        </ul>
      `;

      // Append the hotline card to the container
      hotlinesContainer.appendChild(hotlineCard);
    });
  } catch (error) {
    console.error("Error fetching hotlines: ", error);
    hotlinesContainer.innerHTML = "Error fetching hotlines.";
  }
}

// Fetch hotlines when the page loads
window.onload = function() {
  fetchHotlines();  // Call the fetchHotlines function on page load
};

/* -----------------------------
   Calendar
------------------------------ */
const calendarGrid = document.querySelector('.calendar-grid');
const monthYearLabel = document.getElementById('calendar-month-year');

let calendarEvents = [];
let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

function fetchCalendarEvents() {
  const q = query(collection(db, "calendarActivities"), orderBy("date", "asc"));
  onSnapshot(q, (snapshot) => {
    calendarEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderCalendar(currentMonth, currentYear);
  }, (error) => console.error("Error fetching calendar events:", error));
}

function renderCalendar(month, year) {
  if (!calendarGrid || !monthYearLabel) return;

  calendarGrid.innerHTML = "";
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month));
  monthYearLabel.textContent = `${monthName} ${year}`;

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

    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
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
  overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:9999;";

  const modal = document.createElement("div");
  modal.style = "background:#fff;border-radius:10px;padding:20px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;position:relative;";

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "&times;";
  closeBtn.style = "position:absolute;top:10px;right:20px;font-size:28px;cursor:pointer;font-weight:bold;";

  modal.appendChild(closeBtn);

  events.forEach(ev => {
    const evDiv = document.createElement("div");
    evDiv.style.marginBottom = "20px";
    evDiv.innerHTML = `
      ${ev.imageUrl ? `<img src="${ev.imageUrl}" style="width:100%;border-radius:8px;">` : ""}
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

// Initialize calendar
renderCalendar(currentMonth, currentYear);


const tabButtons = document.querySelectorAll(".banner-button");
const tabPanes = document.querySelectorAll(".tab-pane");

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabPanes.forEach(p => p.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.tab)?.classList.add("active");
  });
});


// Function to fetch footer data from Firestore
async function fetchFooterData() {
  // Reference to the Firestore document where footer data is stored
  const footerDocRef = doc(db, "footer", "footer_data");  // Collection "footer", Document "footer_data"
  
  try {
    const footerDoc = await getDoc(footerDocRef);

    if (footerDoc.exists()) {
      const data = footerDoc.data();
      
      // Update the footer display elements with the fetched data
      document.getElementById('display-address').innerHTML = data.address || "No address set.";
      document.getElementById('display-contact').innerHTML = `
        Tel. Nos.: <strong>${data.phone}</strong><br>
        Email: <a href="mailto:${data.email}">${data.email}</a>
      `;
      
      // Optionally update the map iframe URL if it's part of the data
      if (data.mapUrl) {
        document.getElementById('footer-map').src = data.mapUrl;
      }
    } else {
      console.log("No footer data found.");
    }
  } catch (error) {
    console.error("Error fetching footer data:", error);
  }
}

// Call fetchFooterData when the page loads to populate the footer
window.addEventListener('DOMContentLoaded', fetchFooterData);


const maleTotal = document.getElementById("male-total");
const femaleTotal = document.getElementById("female-total");

// Division values (male)
const maleASOD = document.getElementById("male-asod");
const maleGSD = document.getElementById("male-gsd");
const malePSAMD = document.getElementById("male-psamd");
const maleBGMD = document.getElementById("male-bgmd");
const maleRAMD = document.getElementById("male-ramd");
const malePMD = document.getElementById("male-pmd");

// Division values (female)
const femaleASOD = document.getElementById("female-asod");
const femaleGSD = document.getElementById("female-gsd");
const femalePSAMD = document.getElementById("female-psamd");
const femaleBGMD = document.getElementById("female-bgmd");
const femaleRAMD = document.getElementById("female-ramd");
const femalePMD = document.getElementById("female-pmd");

/* LIVE FETCH USING onSnapshot */
onSnapshot(doc(db, "home", "sexData"), (snap) => {
  if (!snap.exists()) return;

  const data = snap.data();

  // ---- MALE ----
  maleASOD.textContent = data.male.asod;
  maleGSD.textContent = data.male.gsd;
  malePSAMD.textContent = data.male.psamd;
  maleBGMD.textContent = data.male.bgmd;
  maleRAMD.textContent = data.male.ramd;
  malePMD.textContent = data.male.pmd;

  const totalMale =
    data.male.asod +
    data.male.gsd +
    data.male.psamd +
    data.male.bgmd +
    data.male.ramd +
    data.male.pmd;

  maleTotal.textContent = totalMale;

  // ---- FEMALE ----
  femaleASOD.textContent = data.female.asod;
  femaleGSD.textContent = data.female.gsd;
  femalePSAMD.textContent = data.female.psamd;
  femaleBGMD.textContent = data.female.bgmd;
  femaleRAMD.textContent = data.female.ramd;
  femalePMD.textContent = data.female.pmd;

  const totalFemale =
    data.female.asod +
    data.female.gsd +
    data.female.psamd +
    data.female.bgmd +
    data.female.ramd +
    data.female.pmd;

  femaleTotal.textContent = totalFemale;
});

async function loadData() {
  try {
    showLoader();

    const querySnapshot = await getDocs(collection(db, "your-collection-name"));
    if(content) content.innerHTML = ''; // clear existing content
    querySnapshot.forEach((doc) => {
      const div = document.createElement('div');
      div.textContent = JSON.stringify(doc.data());
      content.appendChild(div);
    });

    hideLoader();
  } catch (error) {
    console.error("Error fetching data: ", error);
    hideLoader();
  }
}

// Call the function
loadData();