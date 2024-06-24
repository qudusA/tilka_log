import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || "YOUR_CLIENT_ID";
  const clientSecret = process.env.PAYPAL_SECRET || "YOUR_CLIENT_SECRET";
  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
  // For production, use: return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
}

function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

export { client };
