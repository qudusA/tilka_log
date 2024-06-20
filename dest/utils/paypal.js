"use strict";
// import axios from "axios";
// async function generateAccessToken() {
//   console.log("here to pay...");
//   const response = await axios({
//     url: process.env.PAYPAL_BASE_URL + "/v1/oauth2/token",
//     method: "POST",
//     data: "grant_type=client_credentials",
//     auth: {
//       username:
//         "AffUeV4Z_pGK4KU7sid8NtnU5ihN9OP6Iq-PRkjVwaRFOIvCglgniP4IkkDv1TTb5l1Q-QAFSDEf1lPz",
//       password:
//         "EJk5cc0DswhOGOrtMtU5oNHyYqC17v2yEaXFI3xXz2QfSfEH3ABm7mWPEPQEqcsVUDRmb36gDnBoq47s",
//     },
//     // "PAYPAL_CLIENT_ID": "AffUeV4Z_pGK4KU7sid8NtnU5ihN9OP6Iq-PRkjVwaRFOIvCglgniP4IkkDv1TTb5l1Q-QAFSDEf1lPz",
//     // "PAYPAL_SECRET": "EJk5cc0DswhOGOrtMtU5oNHyYqC17v2yEaXFI3xXz2QfSfEH3ABm7mWPEPQEqcsVUDRmb36gDnBoq47s",
//   });
//   //   console.log(process.env.PAYPAL_CLIENT_ID);
//   //   console.log(response);
//   return response.data.access_token;
// }
// export const createOrder = async () => {
//   //   console.log("here pay...");
//   const accessToken = await generateAccessToken();
//   console.log("here pay...", accessToken);
//   const response = await axios({
//     url: process.env.PAYPAL_BASE_URL + "/v2/checkout/orders",
//     method: "post",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: "Bearer " + accessToken,
//     },
//     data: JSON.stringify({
//       intent: "CAPTURE",
//       purchase_units: [
//         {
//           items: [
//             {
//               name: "Node.js Complete Course",
//               description: "Node.js Complete Course with Express and MongoDB",
//               quantity: 1,
//               unit_amount: {
//                 currency_code: "USD",
//                 value: "100.00",
//               },
//             },
//           ],
//           amount: {
//             currency_code: "USD",
//             value: "100.00",
//             breakdown: {
//               item_total: {
//                 currency_code: "USD",
//                 value: "100.00",
//               },
//             },
//           },
//         },
//       ],
//       application_context: {
//         return_url: process.env.BASE_URL + "/complete-order",
//         cancel_url: process.env.BASE_URL + "/cancel-order",
//         shipping_preference: "NO_SHIPPING",
//         user_action: "PAY_NOW",
//         brand_name: "manfra.io",
//       },
//     }),
//   });
//   console.log(response.data.link);
//   return response.data.links.find(
//     (link: { rel: string }) => link.rel === "approve"
//   ).href;
// };
// export const capturePayment = async (orderId: string) => {
//   const accessToken = await generateAccessToken();
//   const response = await axios({
//     url: process.env.PAYPAL_BASE_URL + `/v2/checkout/orders/${orderId}/capture`,
//     method: "post",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: "Bearer " + accessToken,
//     },
//   });
//   return response.data;
// };
