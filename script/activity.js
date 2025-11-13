import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const container = document.getElementById("activityDetails");

// 🔍 Get the post ID from URL (e.g. ?id=abc123)
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

async function loadActivity() {
  if (!postId) {
    container.innerHTML = "<p>❌ No activity found.</p>";
    return;
  }

  try {
    const docRef = doc(db, "activities", postId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      container.innerHTML = `
        <div class="activity-header">
          <h1>${data.title}</h1>
          <p class="activity-meta">${data.date} — ${data.author}</p>
        </div>
        <img src="${data.imageUrl}" alt="${data.title}" class="activity-image">
        <div class="activity-body">
          <p>${data.description}</p>
        </div>
      `;
    } else {
      container.innerHTML = "<p>❌ Activity not found.</p>";
    }
  } catch (err) {
    console.error("Error loading activity:", err);
    container.innerHTML = "<p>⚠️ Error loading activity.</p>";
  }
}

loadActivity();
