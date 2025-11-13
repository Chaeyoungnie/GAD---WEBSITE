import { db, uploadToCloudinary } from "./firebase.js";
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, getDocs, doc, updateDoc, deleteDoc
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
        <button class="edit-btn" data-id="${docSnap.id}" data-type="${type}" data-container="${containerId}">✏️ Edit</button>
        <button class="delete-btn" data-id="${docSnap.id}" data-type="${type}" data-container="${containerId}">🗑️ Delete</button>
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
  const file = document.getElementById("activity-image")?.files?.[0];
  const status = document.getElementById("activity-status");

  if (!title || !description) {
    status.textContent = "⚠️ Fill all activity fields.";
    return;
  }

  status.textContent = "Uploading...";

  try {
    const imageUrl = file ? await uploadToCloudinary(file) : "";

    await addDoc(collection(db, "activities"), {
      title,
      description,
      imageUrl,
      createdAt: serverTimestamp()
    });

    status.textContent = "✅ Activity Posted!";
    displayActivities();

  } catch (err) {
    console.error(err);
    status.textContent = "❌ Error posting activity.";
  }
}

/* ✅ Display Activities (with Edit/Delete) */
async function displayActivities() {
  const container = document.getElementById("activities-list");
  if (!container) return;
  container.innerHTML = `<p>Loading...</p>`;

  const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  container.innerHTML = "";
  let found = false;

  snap.forEach(docSnap => {
    const d = docSnap.data();
    found = true;

    const card = document.createElement("div");
    card.classList.add("post-card");

    card.innerHTML = `
      ${d.imageUrl ? `<img src="${d.imageUrl}" class="post-img">` : ""}
      <h4>${d.title}</h4>
      <p>${d.description}</p>
      <div class="actions">
        <button class="edit-activity-btn" data-id="${docSnap.id}">✏️ Edit</button>
        <button class="delete-activity-btn" data-id="${docSnap.id}">🗑️ Delete</button>
      </div>
    `;

    container.appendChild(card);
  });

  if (!found) container.innerHTML = `<p>No activities yet.</p>`;

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
        <button class="edit-calendar-btn" data-id="${id}">✏️ Edit</button>
        <button class="delete-calendar-btn" data-id="${id}">🗑️ Delete</button>
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
});
