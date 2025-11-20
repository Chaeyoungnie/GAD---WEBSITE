import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const yearButtonsContainer = document.getElementById("yearButtons");
const yearActivityContainer = document.getElementById("yearActivityContainer");

let groupedActivities = {}; 
let allActivities = [];     // store all activities

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

    groupedActivities = {};
    allActivities = [];

    // Group activities by year
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const year = data.year || "Unknown Year";

      allActivities.push({ id, ...data });

      if (!groupedActivities[year]) groupedActivities[year] = [];
      groupedActivities[year].push({ id, ...data });
    });

    // Sort years descending
    const years = Object.keys(groupedActivities).sort((a, b) => b - a);

    // Create "All" button first
    const allBtn = document.createElement("button");
    allBtn.textContent = "All";
    allBtn.classList.add("year-btn", "active"); // default active
    allBtn.addEventListener("click", () => showAllActivities(allBtn));
    yearButtonsContainer.innerHTML = "";
    yearButtonsContainer.appendChild(allBtn);

    // Create year buttons
    years.forEach(year => {
      const btn = document.createElement("button");
      btn.textContent = year;
      btn.classList.add("year-btn");
      btn.addEventListener("click", () => showActivitiesForYear(year, btn));
      yearButtonsContainer.appendChild(btn);
    });

    // Show ALL activities by default
    showAllActivities(allBtn);

  } catch (err) {
    console.error("Error loading activities:", err);
    yearButtonsContainer.innerHTML = "<p style='color:red;'>Failed to load activities.</p>";
    yearActivityContainer.innerHTML = "";
  }
}

// Show ALL activities
function showAllActivities(btn) {
  document.querySelectorAll(".year-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  yearActivityContainer.innerHTML = "";

  allActivities.forEach(act => {
    const card = createActivityCard(act);
    yearActivityContainer.appendChild(card);
  });
}

// Show activities for a specific year
function showActivitiesForYear(year, btn) {
  document.querySelectorAll(".year-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const activities = groupedActivities[year];
  yearActivityContainer.innerHTML = "";

  activities.forEach(act => {
    const card = createActivityCard(act);
    yearActivityContainer.appendChild(card);
  });
}

// Function to truncate text to a certain number of words
function truncateText(text, wordLimit) {
  if (!text) return "";
  const words = text.split(" ");
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
}

// Reusable card generator with cover photo and truncated description
function createActivityCard(act) {
  const card = document.createElement("div");
  card.classList.add("activity-card");

  const truncatedDescription = truncateText(act.description, 50); // limit to 50 words

  // Use coverPhotoUrl first, fallback to first image in imageUrls
  const coverImage = act.coverPhotoUrl || (act.imageUrls && act.imageUrls[0]) || "";

  card.innerHTML = `
    ${coverImage ? `<img src="${coverImage}" alt="${act.title}" class="activity-img">` : ""}
    <div class="activity-info">
      <h3>${act.title}</h3>
      <p>${truncatedDescription}</p>
    </div>
  `;

  // Redirect to activity page
  card.addEventListener("click", () => {
    window.location.href = `activity.html?id=${act.id}`;
  });

  return card;
}

// Load activities on page load
window.addEventListener("DOMContentLoaded", loadActivities);
