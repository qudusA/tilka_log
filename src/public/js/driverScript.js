document.addEventListener("DOMContentLoaded", () => {
  const socket = io();

  // Replace with actual user ID and role
  const userId = "driverId123";
  const role = "driver";

  // Register user with server
  socket.emit("register", userId, role);

  // Function to send location updates to the server
  const sendLocationUpdate = (position) => {
    const { latitude, longitude } = position.coords;
    console.log(position);
    socket.emit("locationUpdate", {
      driverId: userId,
      lat: latitude,
      lon: longitude,
    });
  };

  // Check for Geolocation support
  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(sendLocationUpdate);
  } else {
    console.log("Geolocation is not supported by your browser");
  }
});
