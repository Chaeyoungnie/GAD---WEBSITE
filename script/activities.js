import { db } from "./firebase.js";
import { collection, getDocs, doc, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const activityContainer = document.getElementById("activityContainer");
const modal = document.getElementById("activityModal");
const modalBody = document.getElementById("activityModalBody");
const closeModal = document.querySelector(".activity-close");

async function loadActivities() {
  const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  activityContainer.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const card = document.createElement("article");
    card.classList.add("blog-card");
    card.innerHTML = `
      <img src="${data.imageUrl}" alt="${data.title}">
      <div class="blog-content">
        <h2>${data.title}</h2>
        <p>${data.description}</p>
        <div class="author">${data.author} · ${data.date}</div>
      </div>
    `;

    // 🟣 When clicked → open popup
    card.addEventListener("click", () => openActivityModal(id));

    activityContainer.appendChild(card);
  });
}

async function openActivityModal(id) {
  modal.style.display = "flex";
  modalBody.innerHTML = "<p>Loading...</p>";

  try {
    const docRef = doc(db, "activities", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      modalBody.innerHTML = `
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
      modalBody.innerHTML = "<p>❌ Activity not found.</p>";
    }
  } catch (err) {
    console.error("Error loading activity:", err);
    modalBody.innerHTML = "<p>⚠️ Error loading activity.</p>";
  }
}

// 🟣 Close modal
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

// 🟣 Close when clicking outside modal
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

loadActivities();
