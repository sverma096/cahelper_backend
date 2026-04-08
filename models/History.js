const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    tool: { type: String, required: true },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("History", HistorySchema);
