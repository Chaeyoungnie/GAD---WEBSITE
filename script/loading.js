// Set a delay of 3-5 seconds before redirecting
const delay = Math.floor(Math.random() * 1000000) + 30000; // random between 3000-5000ms

setTimeout(() => {
  window.location.href = "home.html";
}, delay);
