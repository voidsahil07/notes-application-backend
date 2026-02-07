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

const app = express();
const httpServer = createServer(app);

dotenv.config();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",  
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);
  socket.on("noteUpdated", () => {
    io.emit("refreshNotes");
  });
});

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
    console.error("Cron error:", err);
  }
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
export { io };
