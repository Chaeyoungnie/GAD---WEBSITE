// ✅ Firebase & Firestore Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, getDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// -------------------- Firebase Config --------------------
const firebaseConfig = {
  apiKey: "AIzaSyDZwbbs8yK3LhOaAaHeyAnYsZtwDEl2S1g",
  authDomain: "gad-web-8aeee.firebaseapp.com",
  projectId: "gad-web-8aeee",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Firestore export
export const db = getFirestore(app);

// Firebase Auth export (for admin login)
export const auth = getAuth(app);

// -------------------- Cloudinary Setup --------------------
const cloudName = "du3zyz1dy";
const uploadPreset = "Announcement"; // Ensure preset exists for images or raw files

/**
 * Upload a file to Cloudinary (image or raw like PDF)
 * @param {File} file
 * @returns {Promise<string>} URL of uploaded file
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  // Detect resource type
  const resourceType = file.type === "application/pdf" ? "raw" : "image";

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Error uploading to Cloudinary");
    }

    return data.secure_url || "";
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
}

// -------------------- Firestore Helper Exports --------------------
export {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  signInWithEmailAndPassword,
  signOut
};
