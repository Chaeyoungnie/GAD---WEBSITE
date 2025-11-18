import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const yearButtonsContainer = document.getElementById("yearButtons");
const yearActivityContainer = document.getElementById("yearActivityContainer");

let groupedActivities = {}; // store grouped activities globally

// Load activities from Firestore
async function loadActivities() {
  try {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      yearButtonsContainer.innerHTML = "<p>No activities found.</p>";
      yearActivityContainer.innerHTML = "";
      return;
    }

    // Group activities by year
    groupedActivities = {};
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const year = data.year || "Unknown Year";
      if (!groupedActivities[year]) groupedActivities[year] = [];
      groupedActivities[year].push({ id, ...data });
    });

    // Sort years descending
    const years = Object.keys(groupedActivities).sort((a, b) => b - a);

    // Render year buttons
    yearButtonsContainer.innerHTML = "";
    years.forEach(year => {
      const btn = document.createElement("button");
      btn.textContent = year;
      btn.classList.add("year-btn");
      btn.addEventListener("click", () => showActivitiesForYear(year, btn));
      yearButtonsContainer.appendChild(btn);
    });

    // Initially show a message
    yearActivityContainer.innerHTML = "<p style='text-align:center;'>Select a year to view activities.</p>";

  } catch (err) {
    console.error("Error loading activities:", err);
    yearButtonsContainer.innerHTML = "<p style='color:red;'>Failed to load activities.</p>";
    yearActivityContainer.innerHTML = "";
  }
}

// Show activities for a specific year
function showActivitiesForYear(year, btn) {
  // Highlight the active button
  document.querySelectorAll(".year-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const activities = groupedActivities[year];
  yearActivityContainer.innerHTML = "";

  

  activities.forEach(act => {
    const card = document.createElement("div");
    card.classList.add("activity-card");
    card.innerHTML = `
      ${act.imageUrl ? `<img src="${act.imageUrl}" alt="${act.title}" class="activity-img">` : ""}
      <div class="activity-info">
        <h3>${act.title}</h3>
        <p>${act.description}</p>
      </div>
    `;

    // Click redirects to activity page with ID
    card.addEventListener("click", () => {
      window.location.href = `activity.html?id=${act.id}`;
    });

    yearActivityContainer.appendChild(card);
  });
}

window.addEventListener("DOMContentLoaded", loadActivities);
