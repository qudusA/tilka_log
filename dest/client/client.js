"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const ws = new ws_1.default("ws://localhost:3000");
ws.on("open", () => {
    console.log("client connected");
    ws.send(`Hi, this is a client!`);
});
ws.on("message", (message) => {
    console.log("message sent from server: " + message);
});
