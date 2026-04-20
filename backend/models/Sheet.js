import mongoose from "mongoose";

const columnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "number", "date", "dropdown", "checkbox", "email", "formula"],
      required: true,
    },
    options: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const sheetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    /** Snapshot at creation; legacy sheets may rely on ownerId only until backfilled. */
    memberIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },
    columns: [columnSchema],
  },
  { timestamps: true }
);

const Sheet = mongoose.model("Sheet", sheetSchema);
export default Sheet;
