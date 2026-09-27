const mongoose = require("mongoose");

const sessionPattern = /^\d{4}\/\d{4}$/;
const schema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "institution",
      unique: true,
      immutable: true,
    },
    currentSession: { type: String, required: true, match: sessionPattern },
    scheduledSession: { type: String, match: sessionPattern, default: null },
    scheduledStartAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AcademicSession", schema);
