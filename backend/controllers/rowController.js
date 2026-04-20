import Row from "../models/Row.js";
import { ok, fail } from "../utils/apiResponse.js";
import { getSheetForUser } from "./sheetController.js";

const COLUMN_TYPES = new Set(["text", "number", "date", "dropdown", "checkbox", "email", "formula"]);

function columnIdsSet(sheet) {
  return new Set(sheet.columns.map((c) => c.id));
}

function validateCells(cells, sheet) {
  if (!Array.isArray(cells)) return "cells must be an array";
  const ids = columnIdsSet(sheet);
  for (const cell of cells) {
    if (!cell.columnId) return "Each cell needs columnId";
    if (!ids.has(cell.columnId)) return `Unknown columnId: ${cell.columnId}`;
    const col = sheet.columns.find((c) => c.id === cell.columnId);
    if (col && !COLUMN_TYPES.has(col.type)) return `Invalid column type: ${col.type}`;
  }
  return null;
}

async function nextOrder(sheetId, parentRowId) {
  const filter = { sheetId, parentRowId: parentRowId || null };
  const last = await Row.findOne(filter).sort({ order: -1 }).select("order").lean();
  return last ? last.order + 1 : 0;
}

export const listRows = async (req, res) => {
  try {
    const sheet = await getSheetForUser(req.params.id, req.user);
    if (!sheet) return fail(res, "Sheet not found", 404);
    const rows = await Row.find({ sheetId: sheet._id }).sort({ parentRowId: 1, order: 1 }).lean();
    return ok(res, rows, "Rows loaded");
  } catch (e) {
    return fail(res, e.message || "Failed to list rows", 500);
  }
};

export const createRow = async (req, res) => {
  try {
    const sheet = await getSheetForUser(req.params.id, req.user);
    if (!sheet) return fail(res, "Sheet not found", 404);

    let { cells = [], parentRowId, order, isLocked } = req.body;
    const err = validateCells(cells, sheet);
    if (err) return fail(res, err);

    if (parentRowId) {
      const parent = await Row.findOne({ _id: parentRowId, sheetId: sheet._id });
      if (!parent) return fail(res, "parentRowId not found on this sheet");
    }

    if (typeof order !== "number") {
      order = await nextOrder(sheet._id, parentRowId || null);
    }

    const row = await Row.create({
      sheetId: sheet._id,
      parentRowId: parentRowId || null,
      cells,
      order,
      isLocked: Boolean(isLocked),
    });
    return ok(res, row, "Row created", 201);
  } catch (e) {
    return fail(res, e.message || "Failed to create row", 500);
  }
};

export const updateRow = async (req, res) => {
  try {
    const sheet = await getSheetForUser(req.params.id, req.user);
    if (!sheet) return fail(res, "Sheet not found", 404);

    const row = await Row.findOne({ _id: req.params.rowId, sheetId: sheet._id });
    if (!row) return fail(res, "Row not found", 404);

    const { cells, parentRowId, order, isLocked } = req.body;
    if (cells !== undefined) {
      const err = validateCells(cells, sheet);
      if (err) return fail(res, err);
      row.cells = cells;
    }
    if (parentRowId !== undefined) {
      if (parentRowId === null || parentRowId === "") {
        row.parentRowId = null;
      } else {
        if (parentRowId === row._id.toString()) return fail(res, "Row cannot be its own parent");
        const parent = await Row.findOne({ _id: parentRowId, sheetId: sheet._id });
        if (!parent) return fail(res, "parentRowId not found on this sheet");
        row.parentRowId = parentRowId;
      }
    }
    if (typeof order === "number") row.order = order;
    if (typeof isLocked === "boolean") row.isLocked = isLocked;
    await row.save();
    return ok(res, row, "Row updated");
  } catch (e) {
    return fail(res, e.message || "Failed to update row", 500);
  }
};

async function deleteRowCascade(sheetId, rowId) {
  const children = await Row.find({ sheetId, parentRowId: rowId }).select("_id").lean();
  for (const c of children) {
    await deleteRowCascade(sheetId, c._id);
  }
  await Row.deleteOne({ _id: rowId, sheetId });
}

export const deleteRow = async (req, res) => {
  try {
    const sheet = await getSheetForUser(req.params.id, req.user);
    if (!sheet) return fail(res, "Sheet not found", 404);

    const row = await Row.findOne({ _id: req.params.rowId, sheetId: sheet._id });
    if (!row) return fail(res, "Row not found", 404);

    await deleteRowCascade(sheet._id, row._id);
    return ok(res, null, "Row deleted");
  } catch (e) {
    return fail(res, e.message || "Failed to delete row", 500);
  }
};
