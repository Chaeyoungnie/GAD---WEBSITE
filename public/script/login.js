import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const loginBtn = document.getElementById("login-btn");
const errorMsg = document.getElementById("error-msg");

loginBtn.addEventListener("click", async (e) => {
  e.preventDefault(); // prevent form submission

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    errorMsg.textContent = "⚠️ Please enter email and password.";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Restrict login to a single admin email
    const ADMIN_EMAIL = "gad-admin@gad-email.com"; // change this to your admin email
    if (user.email !== ADMIN_EMAIL) {
      errorMsg.textContent = "❌ Not authorized.";
      await auth.signOut();
      return;
    }

    // Redirect to admin dashboard
    window.location.href = "admin.html";

  } catch (err) {
    console.error("Login Error:", err);
    errorMsg.textContent = "❌ Invalid email or password.";
  }
});
