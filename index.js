import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const users = {}; // Store usernames and their corresponding socket IDs

io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  // Register a user with their username
  socket.on("registerUser", (username) => {
    const normalizedUsername = username.trim().toLowerCase();
    users[normalizedUsername] = socket.id;
    // console.log("Registered user:", normalizedUsername);
    // console.log("Current users:", users); // Thêm dòng này
  });

  // Validate if a recipient exists
  socket.on("validateRecipient", (recipient, callback) => {
    const normalizedRecipient = recipient.trim().toLowerCase(); // Normalize recipient name
    const recipientExists = !!users[normalizedRecipient];
    callback(recipientExists); // Return the validation result to the client
  });

  // Handle sending messages
  socket.on("sendMessage", ({ id, sender, recipient, message, type }) => {
    console.log("Received message on server:");
    console.log("id: ", id);
    console.log("sender: ", sender);
    console.log("recipient: ", recipient);
    console.log("message: ", message);
    console.log("type: ", type);
    const normalizedRecipient = recipient.trim().toLowerCase();
    const recipientSocketId = users[normalizedRecipient];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", {
        id,
        sender,
        recipient,
        message,
        type,
      });
    } else {
      socket.emit("errorMessage", "Recipient not found or offline.");
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    for (const username in users) {
      if (users[username] === socket.id) {
        delete users[username]; // Remove the user from the list
        console.log("User disconnected:", username);
        break;
      }
    }
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
