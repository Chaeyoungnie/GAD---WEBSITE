// Set a delay of 3-5 seconds before redirecting
const delay = Math.floor(Math.random() * 2000) + 3000; // random between 3000-5000ms

setTimeout(() => {
  window.location.href = "home.html";
}, delay);
