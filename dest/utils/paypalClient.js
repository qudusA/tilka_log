"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const checkout_server_sdk_1 = __importDefault(require("@paypal/checkout-server-sdk"));
function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID || "YOUR_CLIENT_ID";
    const clientSecret = process.env.PAYPAL_SECRET || "YOUR_CLIENT_SECRET";
    return new checkout_server_sdk_1.default.core.SandboxEnvironment(clientId, clientSecret);
    // For production, use: return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
}
function client() {
    return new checkout_server_sdk_1.default.core.PayPalHttpClient(environment());
}
exports.client = client;
