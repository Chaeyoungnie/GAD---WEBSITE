import { db, uploadToCloudinary } from "./firebase.js";
import {
  collection, addDoc, serverTimestamp,
  query, where, orderBy, getDocs, doc, updateDoc, deleteDoc,
  getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";




/* ✅ Tab Switcher Global */
window.openTab = function(tabName) {
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.style.display = "none";
  });
  const target = document.getElementById(tabName);
  if (target) target.style.display = "block";
};

/* ✅ Prevent page refresh */
document.querySelectorAll("form").forEach(form => {
  form.addEventListener("submit", e => e.preventDefault());
});

/* ✅ Reusable Submit Function */
async function postData(type, titleId, descId, imgId, statusId, listId) {
  const title = document.getElementById(titleId).value.trim();
  const description = document.getElementById(descId).value.trim();
  const file = document.getElementById(imgId)?.files?.[0];
  const status = document.getElementById(statusId);

  if (!title || !description) {
    status.textContent = "⚠️ Fill in all fields.";
    return;
  }

  status.textContent = "Uploading...";

  try {
    const imageUrl = file ? await uploadToCloudinary(file) : "";

    await addDoc(collection(db, "posts"), {
      title,
      description,
      imageUrl,
      type,
      createdAt: serverTimestamp()
    });

    status.textContent = "✅ Posted!";
    displayPosts(type, listId);

  } catch (e) {
    console.error(e);
    status.textContent = "❌ Error posting.";
  }
}

/* ✅ Display posts per type (with Edit/Delete) */
async function displayPosts(type, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<p>Loading...</p>`;

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  container.innerHTML = "";
  let found = false;

  snap.forEach(docSnap => {
    const d = docSnap.data();
    if (d.type !== type) return;
    found = true;

    const card = document.createElement("div");
    card.classList.add("post-card");

    card.innerHTML = `
      ${d.imageUrl ? `<img src="${d.imageUrl}" class="post-img">` : ""}
      <h4>${d.title}</h4>
      <p>${d.description}</p>
      <div class="actions">
        <button class="edit-btn" data-id="${docSnap.id}" data-type="${type}" data-container="${containerId}"> Edit</button>
        <button class="delete-btn" data-id="${docSnap.id}" data-type="${type}" data-container="${containerId}"> Delete</button>
      </div>
    `;

    container.appendChild(card);
  });

  if (!found) container.innerHTML = `<p>No posts yet.</p>`;

  container.querySelectorAll(".edit-btn").forEach(btn =>
    btn.addEventListener("click", () => enterEditPost(btn.dataset))
  );

  container.querySelectorAll(".delete-btn").forEach(btn =>
    btn.addEventListener("click", () => deletePost(btn.dataset))
  );
}

/* ✅ Edit Post */
async function enterEditPost({ id, type, container }) {
  const containerEl = document.getElementById(container);
  if (!containerEl) return;

  const postCard = Array.from(containerEl.querySelectorAll(".post-card"))
    .find(card => card.querySelector(`[data-id="${id}"]`));
  if (!postCard) return;

  const titleEl = postCard.querySelector("h4");
  const descEl = postCard.querySelector("p");
  const oldTitle = titleEl.textContent;
  const oldDesc = descEl.textContent;

  postCard.innerHTML = `
    <input type="text" id="edit-title-${id}" value="${oldTitle}" style="width:100%;margin-bottom:5px;">
    <textarea id="edit-desc-${id}" style="width:100%;height:80px;">${oldDesc}</textarea>
    <div style="margin-top:8px;">
      <button class="save-btn">💾 Save</button>
      <button class="cancel-btn">❌ Cancel</button>
    </div>
  `;

  postCard.querySelector(".save-btn").addEventListener("click", async () => {
    const newTitle = document.getElementById(`edit-title-${id}`).value.trim();
    const newDesc = document.getElementById(`edit-desc-${id}`).value.trim();

    if (!newTitle || !newDesc) {
      alert("Please fill all fields.");
      return;
    }

    try {
      await updateDoc(doc(db, "posts", id), {
        title: newTitle,
        description: newDesc
      });
      displayPosts(type, container);
    } catch (err) {
      console.error(err);
      alert("Error saving changes.");
    }
  });

  postCard.querySelector(".cancel-btn").addEventListener("click", () => {
    displayPosts(type, container);
  });
}

/* ✅ Delete Post */
async function deletePost({ id, type, container }) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  try {
    await deleteDoc(doc(db, "posts", id));
    displayPosts(type, container);
  } catch (err) {
    console.error(err);
    alert("Error deleting post.");
  }
}

/* ✅ Activities Section */
async function postActivity() {
  const title = document.getElementById("activity-title").value.trim();
  const description = document.getElementById("activity-desc").value.trim();
  const year = document.getElementById("activity-year").value;
  const file = document.getElementById("activity-image")?.files?.[0];
  const status = document.getElementById("activity-status");

  if (!title || !description || !year) {
    status.textContent = "⚠️ Fill all fields including year.";
    return;
  }

  status.textContent = "Uploading...";

  try {
    const imageUrl = file ? await uploadToCloudinary(file) : "";

    await addDoc(collection(db, "activities"), {
      title,
      description,
      imageUrl,
      year,
      createdAt: serverTimestamp()
    });

    status.textContent = "✅ Activity Posted!";
    displayActivities();

  } catch (err) {
    console.error(err);
    status.textContent = "❌ Error posting activity.";
  }
}

// ✅ Dynamically populate year options from 2022 up to current year + 2
function populateYearDropdown() {
  const select = document.getElementById("activity-year");
  if (!select) return;

  const startYear = 2022;
  const currentYear = new Date().getFullYear();
  const futureYear = currentYear + 2; // allow posting for future years

  for (let y = futureYear; y >= startYear; y--) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    select.appendChild(option);
  }
}

document.addEventListener("DOMContentLoaded", populateYearDropdown);

/* ✅ Display Activities (with Edit/Delete) */
async function displayActivities() {
  const container = document.getElementById("activities-list");
  if (!container) return;
  container.innerHTML = `<p>Loading...</p>`;

  const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  container.innerHTML = "";
  if (snap.empty) {
    container.innerHTML = `<p>No activities yet.</p>`;
    return;
  }

  // Group by year
  const grouped = {};
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const year = data.year || "Unknown Year";
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push({ id: docSnap.id, ...data });
  });

  // Sort years descending
  const years = Object.keys(grouped).sort((a, b) => b - a);

  years.forEach(year => {
    const yearButton = document.createElement("button");
    yearButton.textContent = year;
    yearButton.classList.add("year-btn");

    const yearSection = document.createElement("div");
    yearSection.classList.add("year-section");
    yearSection.style.display = "none";

    // Activities under this year
    grouped[year].forEach(act => {
      const card = document.createElement("div");
      card.classList.add("post-card");
      card.innerHTML = `
        ${act.imageUrl ? `<img src="${act.imageUrl}" class="post-img">` : ""}
        <h4>${act.title}</h4>
        <p>${act.description}</p>
        <div class="actions">
          <button class="edit-activity-btn" data-id="${act.id}">Edit</button>
          <button class="delete-activity-btn" data-id="${act.id}">Delete</button>
        </div>
      `;
      yearSection.appendChild(card);
    });

    // Toggle visibility
    yearButton.addEventListener("click", () => {
      yearSection.style.display =
        yearSection.style.display === "none" ? "block" : "none";
    });

    container.appendChild(yearButton);
    container.appendChild(yearSection);
  });

  // Event Listeners for Edit/Delete
  container.querySelectorAll(".edit-activity-btn").forEach(btn =>
    btn.addEventListener("click", () => enterEditActivity(btn.dataset.id))
  );

  container.querySelectorAll(".delete-activity-btn").forEach(btn =>
    btn.addEventListener("click", () => deleteActivity(btn.dataset.id))
  );
}


/* ✅ Edit Activity */
async function enterEditActivity(id) {
  const container = document.getElementById("activities-list");
  const card = Array.from(container.querySelectorAll(".post-card"))
    .find(card => card.querySelector(`[data-id="${id}"]`));
  if (!card) return;

  const titleEl = card.querySelector("h4");
  const descEl = card.querySelector("p");
  const imgEl = card.querySelector("img");
  const oldTitle = titleEl.textContent;
  const oldDesc = descEl.textContent;
  const oldImage = imgEl ? imgEl.src : "";

  card.innerHTML = `
    <input type="text" id="edit-act-title-${id}" value="${oldTitle}" style="width:100%;margin-bottom:5px;">
    <textarea id="edit-act-desc-${id}" style="width:100%;height:80px;">${oldDesc}</textarea>
    <p style="margin-top:5px;">Current Image:</p>
    ${oldImage ? `<img src="${oldImage}" style="width:100%;border-radius:6px;margin-bottom:5px;">` : "<p>No image</p>"}
    <input type="file" id="edit-act-img-${id}" accept="image/*">
    <div style="margin-top:8px;">
      <button class="save-btn">💾 Save</button>
      <button class="cancel-btn">❌ Cancel</button>
    </div>
  `;

  card.querySelector(".save-btn").addEventListener("click", async () => {
    const newTitle = document.getElementById(`edit-act-title-${id}`).value.trim();
    const newDesc = document.getElementById(`edit-act-desc-${id}`).value.trim();
    const newFile = document.getElementById(`edit-act-img-${id}`).files[0];

    if (!newTitle || !newDesc) {
      alert("Please fill all fields.");
      return;
    }

    try {
      let imageUrl = oldImage;
      if (newFile) {
        imageUrl = await uploadToCloudinary(newFile);
      }

      await updateDoc(doc(db, "activities", id), {
        title: newTitle,
        description: newDesc,
        imageUrl
      });
      displayActivities();
    } catch (err) {
      console.error(err);
      alert("Error saving activity.");
    }
  });

  card.querySelector(".cancel-btn").addEventListener("click", displayActivities);
}

/* ✅ Delete Activity */
async function deleteActivity(id) {
  if (!confirm("Are you sure you want to delete this activity?")) return;

  try {
    await deleteDoc(doc(db, "activities", id));
    displayActivities();
  } catch (err) {
    console.error(err);
    alert("Error deleting activity.");
  }
}

/* ✅ Documentations Upload */
async function uploadDocumentation() {
  const file = document.getElementById("doc-image").files[0];
  const status = document.getElementById("doc-status");

  if (!file) {
    status.textContent = "⚠️ Please select a file.";
    return;
  }

  status.textContent = "Uploading...";

  try {
    // uploadToCloudinary is your existing function to upload the file
    const imageUrl = await uploadToCloudinary(file);

    // Save the document to Firestore with createdAt timestamp
    await addDoc(collection(db, "documentations"), {
      imageUrl,
      createdAt: serverTimestamp()
    });

    status.textContent = "✅ Uploaded successfully!";
    displayDocumentations();  // Refresh the list
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Upload failed.";
  }
}

/* Display documentations with delete buttons */
async function displayDocumentations() {
  const list = document.getElementById("docs-list");
  list.innerHTML = `<p>Loading...</p>`;

  const q = query(collection(db, "documentations"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  list.innerHTML = "";
  if (snap.empty) {
    list.innerHTML = "<p>No files uploaded yet.</p>";
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const docId = docSnap.id;

    const div = document.createElement("div");
    div.classList.add("doc-item");
    div.style.margin = "10px";
    div.style.position = "relative";
    div.style.display = "inline-block";

    div.innerHTML = `
      <img src="${d.imageUrl}" width="200" style="border-radius:8px; display: block;">
      <button style="
        position: absolute;
        top: 5px;
        right: 5px;
        background: red;
        color: white;
        border: none;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        cursor: pointer;
      " title="Delete">&times;</button>
    `;

    // Delete button event
    div.querySelector("button").addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this file?")) {
        try {
          await deleteDoc(doc(db, "documentations", docId));
          displayDocumentations();  // Refresh list after deletion
        } catch (error) {
          console.error("Delete failed:", error);
          alert("Failed to delete file.");
        }
      }
    });

    list.appendChild(div);
  });
}

async function postCalendarActivity() {
  const title = document.getElementById("calendar-title").value.trim();
  const description = document.getElementById("calendar-desc").value.trim();
  const date = document.getElementById("calendar-date").value;
  const file = document.getElementById("calendar-image")?.files?.[0];
  const status = document.getElementById("calendar-status");

  if (!title || !description || !date) {
    status.textContent = "⚠️ Fill in all fields.";
    return;
  }

  status.textContent = "Uploading...";

  try {
    const imageUrl = file ? await uploadToCloudinary(file) : "";

    await addDoc(collection(db, "calendarActivities"), {
      title,
      description,
      date,
      imageUrl,
      createdAt: serverTimestamp()
    });

    status.textContent = "✅ Activity added!";
    displayCalendarActivities();

  } catch (err) {
    console.error(err);
    status.textContent = "❌ Error adding activity.";
  }
}

/* ✅ Display Calendar Activities */
async function displayCalendarActivities() {
  const container = document.getElementById("calendar-list");
  container.innerHTML = `<p>Loading...</p>`;

  const q = query(collection(db, "calendarActivities"), orderBy("date", "asc"));
  const snap = await getDocs(q);

  container.innerHTML = "";
  if (snap.empty) {
    container.innerHTML = "<p>No activities found.</p>";
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const id = docSnap.id;

    const card = document.createElement("div");
    card.classList.add("post-card");

    card.innerHTML = `
      ${d.imageUrl ? `<img src="${d.imageUrl}" class="post-img">` : ""}
      <h4>${d.title}</h4>
      <p>${d.description}</p>
      <p><strong>Date:</strong> ${d.date}</p>
      <div class="actions">
        <button class="edit-calendar-btn" data-id="${id}">Edit</button>
        <button class="delete-calendar-btn" data-id="${id}">Delete</button>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll(".edit-calendar-btn").forEach(btn =>
    btn.addEventListener("click", () => editCalendarActivity(btn.dataset.id))
  );

  container.querySelectorAll(".delete-calendar-btn").forEach(btn =>
    btn.addEventListener("click", () => deleteCalendarActivity(btn.dataset.id))
  );
}

/* ✅ Edit Calendar Activity */
async function editCalendarActivity(id) {
  const container = document.getElementById("calendar-list");
  const card = Array.from(container.querySelectorAll(".post-card"))
    .find(c => c.querySelector(`[data-id="${id}"]`));
  if (!card) return;

  const oldTitle = card.querySelector("h4").textContent;
  const oldDesc = card.querySelectorAll("p")[0].textContent;
  const oldDate = card.querySelectorAll("p")[1].textContent.replace("Date: ", "");
  const oldImage = card.querySelector("img")?.src || "";

  card.innerHTML = `
    <input type="text" id="edit-cal-title-${id}" value="${oldTitle}" style="width:100%;margin-bottom:5px;">
    <textarea id="edit-cal-desc-${id}" style="width:100%;height:80px;">${oldDesc}</textarea>
    <input type="date" id="edit-cal-date-${id}" value="${oldDate}" style="margin-top:5px;">
    ${oldImage ? `<img src="${oldImage}" style="width:100%;margin-top:5px;">` : ""}
    <input type="file" id="edit-cal-img-${id}" accept="image/*">
    <div style="margin-top:8px;">
      <button class="save-btn">💾 Save</button>
      <button class="cancel-btn">❌ Cancel</button>
    </div>
  `;

  card.querySelector(".save-btn").addEventListener("click", async () => {
    const newTitle = document.getElementById(`edit-cal-title-${id}`).value.trim();
    const newDesc = document.getElementById(`edit-cal-desc-${id}`).value.trim();
    const newDate = document.getElementById(`edit-cal-date-${id}`).value;
    const newFile = document.getElementById(`edit-cal-img-${id}`).files[0];

    if (!newTitle || !newDesc || !newDate) return alert("Fill all fields");

    try {
      let imageUrl = oldImage;
      if (newFile) imageUrl = await uploadToCloudinary(newFile);

      await updateDoc(doc(db, "calendarActivities", id), {
        title: newTitle,
        description: newDesc,
        date: newDate,
        imageUrl
      });

      displayCalendarActivities();
    } catch (err) {
      console.error(err);
      alert("Error saving activity.");
    }
  });

  card.querySelector(".cancel-btn").addEventListener("click", displayCalendarActivities);
}

/* ✅ Delete Calendar Activity */
async function deleteCalendarActivity(id) {
  if (!confirm("Delete this activity?")) return;
  try {
    await deleteDoc(doc(db, "calendarActivities", id));
    displayCalendarActivities();
  } catch (err) {
    console.error(err);
    alert("Failed to delete activity.");
  }
}

/* ✅ Form listener */
document.getElementById("calendar-form").addEventListener("submit", postCalendarActivity);

/* ✅ Form Listeners */
document.getElementById("ann-form").addEventListener("submit", () =>
  postData("announcement","ann-title","ann-desc","ann-image","ann-status","announcements-list")
);
document.getElementById("event-form").addEventListener("submit", () =>
  postData("event","event-title","event-desc","event-image","event-status","events-list")
);
document.getElementById("activity-form").addEventListener("submit", postActivity);
document.getElementById("doc-form").addEventListener("submit", uploadDocumentation);
/* ✅ Load existing posts + activities */

window.addEventListener("DOMContentLoaded", () => {
  displayPosts("announcement","announcements-list");
  displayPosts("event","events-list");
  displayActivities();
  displayCalendarActivities();
  displayDocumentations();
  loadCampaignTheme();
});

/* ✅ Banner Upload, Display, and Delete */
const bannerForm = document.getElementById("banner-form");
const bannerInput = document.getElementById("banner-image");
const bannerStatus = document.getElementById("banner-status");
const bannerImg = document.getElementById("banner-img"); // select by ID
const deleteBannerBtn = document.getElementById("delete-banner-btn");

const bannerDocId = "site-banner"; // Firestore doc ID

// Display current banner
async function displayBanner() {
  const docRef = doc(db, "banners", bannerDocId);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().imageUrl) {
      bannerImg.src = docSnap.data().imageUrl;
      deleteBannerBtn.style.display = "block"; // show button
    } else {
      bannerImg.src = "";
      deleteBannerBtn.style.display = "none"; // hide button
    }
  } catch (err) {
    console.error(err);
    bannerImg.src = "";
    deleteBannerBtn.style.display = "none";
  }
}

// Upload new banner
bannerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = bannerInput.files[0];
  if (!file) {
    bannerStatus.textContent = "⚠️ Select a file first.";
    return;
  }

  bannerStatus.textContent = "Uploading...";
  try {
    const imageUrl = await uploadToCloudinary(file);

    await setDoc(doc(db, "banners", bannerDocId), {
      imageUrl,
      updatedAt: serverTimestamp()
    });

    bannerStatus.textContent = "✅ Banner uploaded!";
    bannerInput.value = "";
    displayBanner();
  } catch (err) {
    console.error(err);
    bannerStatus.textContent = "❌ Upload failed.";
  }
});

// Delete banner
deleteBannerBtn.addEventListener("click", async () => {
  if (!confirm("Delete the current banner?")) return;
  try {
    await deleteDoc(doc(db, "banners", bannerDocId));
    bannerStatus.textContent = "✅ Banner deleted!";
    displayBanner();
  } catch (err) {
    console.error(err);
    bannerStatus.textContent = "❌ Failed to delete banner.";
  }
});

// Load banner on page load
window.addEventListener("DOMContentLoaded", displayBanner);

async function loadCampaignTheme() {
  const themeDoc = await getDoc(doc(db, "siteSettings", "campaignTheme"));

  if (themeDoc.exists()) {
    const data = themeDoc.data();
    document.getElementById("theme-title").value = data.title || "";
    document.getElementById("theme-description").value = data.description || "";
    document.getElementById("theme-image-preview").src = data.imageUrl || "";
  }
}

async function saveCampaignTheme(e) {
  e.preventDefault();

  const status = document.getElementById("theme-status");
  const title = document.getElementById("theme-title").value.trim();
  const description = document.getElementById("theme-description").value.trim();
  const file = document.getElementById("theme-image").files[0];

  status.textContent = "Uploading...";

  try {
    let imageUrl = document.getElementById("theme-image-preview").src;

    if (file) {
      imageUrl = await uploadToCloudinary(file);
    }

    await setDoc(doc(db, "siteSettings", "campaignTheme"), {
      title,
      description,
      imageUrl,
      updatedAt: serverTimestamp()
    });

    status.textContent = "✅ Saved!";
    document.getElementById("theme-image").value = "";

    loadCampaignTheme();

  } catch (err) {
    console.error(err);
    status.textContent = "❌ Error saving.";
  }
}

document.getElementById("campaign-theme-form")
  .addEventListener("submit", saveCampaignTheme);


document.querySelectorAll(".resource-form").forEach(form => {
  const uploadTypeSelect = form.querySelector(".res-upload-type");
  const fileInput = form.querySelector(".res-file");
  const urlInput = form.querySelector(".res-url");
  const previewDiv = form.querySelector(".res-preview");

  // Toggle File / URL inputs
  uploadTypeSelect.addEventListener("change", () => {
    if (uploadTypeSelect.value === "file") {
      fileInput.style.display = "block";
      urlInput.style.display = "none";
      previewDiv.innerHTML = ""; // clear preview
    } else {
      fileInput.style.display = "none";
      urlInput.style.display = "block";
      previewDiv.innerHTML = ""; // clear preview
    }
  });

  // File preview
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) {
      previewDiv.innerHTML = "";
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => {
        previewDiv.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width:200px;">`;
      };
      reader.readAsDataURL(file);
    } else {
      previewDiv.innerHTML = `<p>Selected file: ${file.name}</p>`;
    }
  });

  // Form submission
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const type = form.dataset.type;
    const title = form.querySelector(".res-title").value.trim();
    const description = form.querySelector(".res-desc").value.trim();
    const uploadType = uploadTypeSelect.value;
    const file = fileInput.files[0];
    const urlValue = urlInput.value.trim();
    const status = form.querySelector(".res-status");

    if (!title || !description || (uploadType === "file" && !file) || (uploadType === "url" && !urlValue)) {
      status.textContent = "⚠️ Please fill all fields.";
      return;
    }

    status.textContent = "Uploading...";

    try {
      let fileUrl = "";

      if (uploadType === "file") {
        fileUrl = await uploadToCloudinary(file);
      } else {
        fileUrl = urlValue;
      }

      // Add resource to Firestore
      await addDoc(collection(db, "resources"), {
        title,
        description,
        fileUrl,
        type,
        createdAt: serverTimestamp()
      });

      status.textContent = "✅ Uploaded!";
      form.reset();
      fileInput.style.display = "block";
      urlInput.style.display = "none";
      previewDiv.innerHTML = "";

      // Refresh the list of resources
      displayResources(type);
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Error uploading.";
    }
  });
});

window.downloadPDF = function(url, filename = "file.pdf") {
  fetch(url)
    .then(resp => resp.blob())
    .then(blob => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    })
    .catch(err => {
      console.error("Error downloading PDF:", err);
    });
};


// === DISPLAY RESOURCES WITH DOWNLOAD AND EDIT BUTTONS ===
async function displayResources(type) {
  const container = document.getElementById(`${type}-list`);
  if (!container) return;

  container.innerHTML = "Loading...";

  try {
    const qRes = query(
      collection(db, "resources"),
      where("type", "==", type),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(qRes);

    if (snap.empty) {
      container.innerHTML = `<p>No resources found for ${type}.</p>`;
      return;
    }

    container.innerHTML = ""; // Clear existing content

    snap.docs.forEach(docItem => {
      const data = docItem.data();
      const docId = docItem.id;

      const card = document.createElement("div");
      card.className = "resource-item";
      
      let fileLink = `<a href="${data.fileUrl}" target="_blank">Read More</a>`;
      
      // Check if the file is a PDF (based on file URL or MIME type)
      if (data.fileUrl.endsWith(".pdf")) {
        // Modify the link to make it download the PDF
        fileLink = `<button onclick="downloadPDF('${data.fileUrl}', '${data.title}.pdf')">Download PDF</button>`;
      }

      card.innerHTML = `
        <h4>${data.title}</h4>
        <p>${data.description}</p>
        ${fileLink}
        <div class="resource-actions">
          <button class="edit-btn" data-id="${docId}">✏️ Edit</button>
          <button class="delete-btn" data-id="${docId}">🗑️ Delete</button>
        </div>
      `;

      container.appendChild(card);

      // Edit Button
      card.querySelector(".edit-btn").addEventListener("click", () => {
        const title = prompt("Edit Title:", data.title);
        const description = prompt("Edit Description:", data.description);

        if (title !== null && description !== null) {
          // Update the resource in Firestore
          updateDoc(doc(db, "resources", docId), {
            title,
            description
          }).then(() => {
            alert("Resource updated!");
            displayResources(type); // Refresh the list
          }).catch(err => {
            console.error("Error updating resource:", err);
          });
        }
      });

      // Delete Button
      card.querySelector(".delete-btn").addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this resource?")) return;

        try {
          // Delete resource from Firestore
          await deleteDoc(doc(db, "resources", docId));
          alert("Resource deleted successfully!");
          displayResources(type); // Refresh the list
        } catch (err) {
          console.error("Error deleting resource:", err);
          alert("Error deleting resource.");
        }
      });
    });
  } catch (err) {
    console.error("Error loading resources:", err);
    container.innerHTML = `<p>Error loading resources.</p>`;
  }
}

// === INITIAL LOAD ===
["accomplishmentReports", "specialOrders", "gadLaws", "dswdAgenda", "genderlaws"].forEach(displayResources);


document.getElementById('member-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get form values
  const name = document.getElementById('name').value;
  const role = document.getElementById('role').value;
  const position = document.getElementById('position').value;
  const photo = document.getElementById('photo').files[0];

  // Validate input fields
  if (!name || !role || !position || !photo) {
    alert('All fields are required.');
    return;
  }

  try {
    // Upload the photo to Cloudinary
    const photoURL = await uploadToCloudinary(photo);

    if (!photoURL) {
      alert('Error uploading photo. Please try again.');
      return;
    }

    // Add the new member to Firestore
    await addDoc(collection(db, 'members'), {
      name: name,
      role: role,
      position: position,
      photoURL: photoURL,  // Cloudinary URL
      createdAt: serverTimestamp()  // Firestore timestamp
    });

    // Clear the form
    document.getElementById('member-form').reset();

    // Success message
    alert('New member added successfully!');
  } catch (error) {
    console.error('Error adding member: ', error);
    alert('Error adding member. Please try again.');
  }
});


async function displayMembers() {
  const membersList = document.getElementById('members-list');

  if (!membersList) {
    console.error('Error: members-list element not found.');
    return;
  }

  try {
    // Fetch members from Firestore
    const membersRef = collection(db, 'members');
    const q = query(membersRef, orderBy('createdAt'));
    const querySnapshot = await getDocs(q);

    // Clear current list before displaying new data
    membersList.innerHTML = '';

    querySnapshot.forEach((docSnap) => {
      const member = docSnap.data();
      const memberId = docSnap.id;

      const memberCard = document.createElement('div');
      memberCard.classList.add('member-card');

      memberCard.innerHTML = `
        <img src="${member.photoURL}" alt="${member.name}'s photo" class="member-photo">
        <div class="member-info">
          <h4>${member.name}</h4>
          <p><strong>Role:</strong> ${member.role}</p>
          <p><strong>Position:</strong> ${member.position}</p>
        </div>
        <div class="member-actions">
          <button onclick="editMember('${memberId}')">Edit</button>
          <button onclick="deleteMember('${memberId}')">Delete</button>
        </div>
      `;

      membersList.appendChild(memberCard);
    });
  } catch (error) {
    console.error('Error fetching members:', error);
  }
}

// Open Modal and Populate with Member Data
window.editMember = async function (memberId) {
  const memberRef = doc(db, 'members', memberId);

  try {
    // Fetch the current data of the member from Firestore
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      console.error('Member not found');
      return;
    }

    // Get the current member data
    const member = memberSnap.data();

    // Populate the modal with the current member data
    document.getElementById('edit-name').value = member.name;
    document.getElementById('edit-role').value = member.role;
    document.getElementById('edit-position').value = member.position;

    // Save the memberId to the modal form for later reference when updating
    document.getElementById('edit-member-form').dataset.memberId = memberId;

    // Display the modal
    document.getElementById('edit-member-modal').classList.add('active');
  } catch (error) {
    console.error('Error fetching member:', error);
  }
};

// Close the modal when the user clicks the "X"
document.getElementById('close-modal').addEventListener('click', function () {
  document.getElementById('edit-member-modal').classList.remove('active');
});

// Close the modal when the user clicks outside the modal content
window.onclick = function (event) {
  if (event.target === document.getElementById('edit-member-modal')) {
    document.getElementById('edit-member-modal').classList.remove('active');
  }
};

// Handle the form submission for updating the member
document.getElementById('edit-member-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Get the memberId from the form's data attribute
  const memberId = this.dataset.memberId;

  // Get the updated values from the modal form
  const name = document.getElementById('edit-name').value;
  const role = document.getElementById('edit-role').value;
  const position = document.getElementById('edit-position').value;
  const photo = document.getElementById('edit-photo').files[0];

  // Reference to the member document in Firestore
  const memberRef = doc(db, 'members', memberId);

  // Fetch the existing member data from Firestore (if needed)
  const memberSnap = await getDoc(memberRef);
  const member = memberSnap.data();

  // If a new photo is uploaded, upload it to Cloudinary
  let photoURL = member.photoURL;
  if (photo) {
    photoURL = await uploadToCloudinary(photo);
  }

  // Update the member document in Firestore
  try {
    await updateDoc(memberRef, {
      name: name,
      role: role,
      position: position,
      photoURL: photoURL, // Updated photoURL if a new image was uploaded
      updatedAt: serverTimestamp() // Optional: Add a timestamp for the update
    });

    // Close the modal and refresh the member list
    document.getElementById('edit-member-modal').classList.remove('active');
    alert('Member updated successfully!');
    displayMembers();  // Refresh the list after the update
  } catch (error) {
    console.error('Error updating member:', error);
  }
});

// Delete member function
window.deleteMember = async function (memberId) {
  const memberRef = doc(db, 'members', memberId);

  try {
    // Delete the member from Firestore
    await deleteDoc(memberRef);

    alert('Member deleted successfully!');
    displayMembers();  // Refresh the members list
  } catch (error) {
    console.error('Error deleting member:', error);
  }
};

// Call the function to display members after the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  displayMembers();
});
