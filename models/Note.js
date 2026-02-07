import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // NEW
  pinned: { type: Boolean, default: false },
  priority: { type: String, default: "normal" },
  createdAt: { type: Date, default: Date.now },
  reminderAt: { type: Date },
  reminderSent: { type: Boolean, default: false }
});

export default mongoose.model("Note", noteSchema);
