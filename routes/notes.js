import express from "express";
import Note from "../models/Note.js";
import { io } from "../server.js";
import { authMiddleware } from "../middleware/auth.js"; // NEW

const router = express.Router();

// ALL ROUTES NOW PROTECTED
router.use(authMiddleware);

router.get("/", async (req, res) => {
  const notes = await Note.find({ userId: req.user.id }).sort({ pinned: -1, createdAt: -1 });
  res.json(notes);
});

router.post("/", async (req, res) => {
  const note = new Note({
    ...req.body,
    userId: req.user.id  // NEW
  });
  await note.save();
  io.emit("refreshNotes"); // Note: in production, emit to user-specific rooms
  res.json(note);
});

router.put("/:id", async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id }, // OWNERSHIP CHECK
    {
      ...req.body,
      reminderSent: false
    },
    { new: true }
  );
  if (!note) return res.status(404).json({ msg: "Note not found" });
  io.emit("refreshNotes");
  res.json(note);
});

router.delete("/:id", async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!note) return res.status(404).json({ msg: "Note not found" });
  io.emit("refreshNotes");
  res.json({ success: true });
});

router.put("/:id/toggle-pin", async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
  if (!note) return res.status(404).json({ msg: "Note not found" });
  note.pinned = !note.pinned;
  await note.save();
  io.emit("refreshNotes");
  res.json(note);
});

export default router;
