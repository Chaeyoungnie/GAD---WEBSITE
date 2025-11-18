// ✅ Firebase & Firestore Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDZwbbs8yK3LhOaAaHeyAnYsZtwDEl2S1g",
  authDomain: "gad-web-8aeee.firebaseapp.com",
  projectId: "gad-web-8aeee",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ✅ Cloudinary Config
const cloudName = "du3zyz1dy";
const uploadPreset = "Announcement";

// Upload image to Cloudinary
export async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url || "";
}
