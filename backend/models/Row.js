import mongoose from "mongoose";

const cellSchema = new mongoose.Schema(
  {
    columnId: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    formula: { type: String },
  },
  { _id: false }
);

const rowSchema = new mongoose.Schema(
  {
    sheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sheet",
      required: true,
      index: true,
    },
    parentRowId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    cells: [cellSchema],
    order: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Row = mongoose.model("Row", rowSchema);
export default Row;
