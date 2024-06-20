"use strict";
// io.on("connection", (socket) => {
//   console.log("A user connected with id:", socket.id);
//   socket.on("register", async (userId: string, role: "buyer" | "driver") => {
//     console.log(
//       `User ${userId} registered as ${role} with socket id: ${socket.id}`
//     );
//     // Check if user already exists
//     let user = await User.findOne({ where: { userId } });
//     if (user) {
//       // Update existing user
//       await user.update({ socketId: socket.id });
//     } else {
//       // Create new user
//       await User.create({ userId, name: userId, role, socketId: socket.id });
//     }
//   });
//   socket.on(
//     "locationUpdate",
//     async (data: { driverId: string; lat: number; lon: number }) => {
//       const driverId = data.driverId;
//       const deliveries = await Delivery.findAll({ where: { driverId } });
//       for (const delivery of deliveries) {
//         const order = await Order.findOne({
//           where: { orderId: delivery.orderId },
//         });
//         const buyer = await User.findOne({ where: { userId: order.buyerId } });
//         if (buyer && buyer.socketId) {
//           io.to(buyer.socketId).emit("driverLocation", {
//             orderId: delivery.orderId,
//             lat: data.lat,
//             lon: data.lon,
//           });
//         }
//       }
//     }
//   );
//   socket.on("trackOrder", async (orderId: string, buyerId: string) => {
//     const order = await Order.findOne({ where: { orderId, buyerId } });
//     if (order) {
//       const delivery = await Delivery.findOne({ where: { orderId } });
//       if (delivery) {
//         const driver = await User.findOne({
//           where: { userId: delivery.driverId },
//         });
//         if (driver && driver.socketId) {
//           io.to(driver.socketId).emit("startTracking", orderId);
//         }
//       }
//     }
//   });
//   socket.on("disconnect", async () => {
//     console.log("User disconnected:", socket.id);
//     await User.update({ socketId: null }, { where: { socketId: socket.id } });
//   });
// });
