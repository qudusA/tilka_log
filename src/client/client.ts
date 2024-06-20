import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", () => {
  console.log("client connected");
  ws.send(`Hi, this is a client!`);
});

ws.on("message", (message) => {
  console.log("message sent from server: " + message);
});
