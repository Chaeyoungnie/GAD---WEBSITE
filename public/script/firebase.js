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
const uploadPreset = "Announcement"; // Ensure you have a preset for raw file types like PDFs

// Upload files (raw or image) to Cloudinary
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);  // Use your preset name

  // Determine the resource type based on the file's MIME type
  const resourceType = file.type === "application/pdf" ? "raw" : "image"; // Use raw for PDFs and image for others

  // The URL endpoint for raw files (PDFs) and image files
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error.message || "Error uploading to Cloudinary");
    }

    return data.secure_url || "";  // Return the URL of the uploaded file
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;  // Propagate error for handling elsewhere
  }
}
