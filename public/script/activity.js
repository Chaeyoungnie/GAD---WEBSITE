import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const container = document.getElementById("activityDetails");

// Get post ID from URL
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

    if (!docSnap.exists()) {
      container.innerHTML = "<p>❌ Activity not found.</p>";
      return;
    }

    const data = docSnap.data();

    // Combine cover photo and additional images
    const images = [];
    if (data.coverPhotoUrl) images.push(data.coverPhotoUrl);
    if (data.imageUrls && data.imageUrls.length > 0) images.push(...data.imageUrls);

    // Create carousel slides with opacity
    let slidesHtml = images.map((url, idx) => `
      <img src="${url}" alt="${data.title}" class="blog-image carousel-slide" style="
        opacity: ${idx === 0 ? 1 : 0};
        position: absolute;
        top: 0;
        left: 0;
        width:100%;
        height:400px;
        object-fit:cover;
        border-radius:8px;
        transition: opacity 1s ease-in-out;
      ">
    `).join("");

    container.innerHTML = `
      <div class="blog-post">
        <h1 class="blog-title">${data.title}</h1>
        <div class="carousel-wrapper" style="position:relative; height:400px; overflow:hidden;">
          ${slidesHtml}
        </div>
        <div class="blog-content" style="margin-top:10px;">
          <p>${data.description}</p>
        </div>
      </div>
    `;

    const slides = container.querySelectorAll(".carousel-slide");
    let current = 0;

    // Auto-slide every 3 seconds with fade
    setInterval(() => {
      slides[current].style.opacity = 0;
      current = (current + 1) % slides.length;
      slides[current].style.opacity = 1;
    }, 3000);

  } catch (err) {
    console.error("Error loading activity:", err);
    container.innerHTML = "<p>⚠️ Error loading activity.</p>";
  }
}

loadActivity();
