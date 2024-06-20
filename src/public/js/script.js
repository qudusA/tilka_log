"use strict";
const lat = document.getElementById("latitude");
const lon = document.getElementById("longitude");

const c = document.getElementById("count");
let count = 0;

// setInterval(() => {
//   navigator.geolocation.watchPosition((position) => {
//     const { latitude, longitude, speed, altitude } = position.coords;
//     console.log(count++);
//     console.log("lat: " + latitude);
//     console.log("log: " + longitude);
//     console.log("alt: " + altitude);
//     console.log("speed: " + speed);
//     lat.innerHTML = latitude;
//     lon.textContent = longitude;
//     c.innerHTML = count;
//   });
// }, 1000);

navigator.geolocation.watchPosition((position) => {
  const { latitude, longitude, speed, altitude } = position.coords;
  console.log("lat: " + latitude);
  console.log("log: " + longitude);
  console.log("alt: " + altitude);
  console.log("speed: " + speed);
  lat.textContent = latitude;
  lon.textContent = longitude;
});

// document.addEventListener("DOMContentLoaded", () => {
//   const socket = io("http://localhost:3000/ip");

//   // Replace with actual user ID and role
//   const userId = "buyerId123";
//   const role = "buyer";
//   console.log("bbbbbbbbbb");

//   // Register user with server
//   socket.emit("register", userId, role);

//   const trackOrderButton = document.getElementById("trackOrderButton");
//   trackOrderButton.addEventListener("click", () => {
//     const orderId = document.getElementById("orderId").value;
//     socket.emit("trackOrder", orderId, userId);
//   });

//   socket.on("driverLocation", (data) => {
//     document.getElementById("latitude").textContent = data.lat;
//     document.getElementById("longitude").textContent = data.lon;
//   });
// });
