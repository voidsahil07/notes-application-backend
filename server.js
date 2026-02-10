import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import noteRoutes from "./routes/notes.js";
import authRoutes from "./routes/auth.js";
import cron from "node-cron";
import Note from "./models/Note.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

/* =======================
   ALLOWED ORIGINS
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://notes-application-frontend-o3virl133-voidsahil07s-projects.vercel.app/" // 🔁 replace with your real Vercel URL
];

/* =======================
   CORS (EXPRESS)
======================= */
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

/* =======================
   SOCKET.IO
======================= */
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

/* =======================
   DATABASE
======================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

/* =======================
   ROUTES
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

/* =======================
   SOCKET EVENTS
======================= */
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("noteUpdated", () => {
    io.emit("refreshNotes");
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/* =======================
   CRON JOB
======================= */
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const dueNotes = await Note.find({
      reminderAt: { $lte: now },
      reminderSent: false
    });

    for (const note of dueNotes) {
      io.emit("reminderDue", {
        _id: note._id,
        title: note.title,
        content: note.content,
        reminderAt: note.reminderAt
      });

      note.reminderSent = true;
      await note.save();
    }
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export { io };
