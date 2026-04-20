import crypto from "crypto";
import mongoose from "mongoose";
import Sheet from "../models/Sheet.js";
import Row from "../models/Row.js";
import User from "../models/User.js";
import { ok, fail } from "../utils/apiResponse.js";

function defaultColumns() {
  const id = crypto.randomUUID();
  return [
    {
      id,
      name: "Column 1",
      type: "text",
      options: [],
      order: 0,
    },
  ];
}

function effectiveStatus(sheet) {
  return sheet.status || "approved";
}

/** Deduped member id strings; legacy docs use ownerId when memberIds empty. */
export function effectiveMemberIds(sheet) {
  const raw = sheet.memberIds;
  const fromMembers =
    Array.isArray(raw) && raw.length > 0 ? raw.map((id) => id.toString()) : [];
  if (fromMembers.length > 0) return [...new Set(fromMembers)];
  if (sheet.ownerId) return [sheet.ownerId.toString()];
  return [];
}

function userIsMember(sheet, userId) {
  return effectiveMemberIds(sheet).includes(userId.toString());
}

export async function getSheetForUser(sheetId, user) {
  const sheet = await Sheet.findById(sheetId);
  if (!sheet) return null;
  if (user.role === "admin") return sheet;
  if (effectiveStatus(sheet) !== "approved") return null;
  if (!userIsMember(sheet, user._id)) return null;
  return sheet;
}

/**
 * Admin: any sheet. Member: delete if pending/rejected, or approved solo sheet.
 * Approved multi-member: only admin (members cannot wipe shared sheets).
 */
async function getSheetForDeletion(sheetId, user) {
  const sheet = await Sheet.findById(sheetId);
  if (!sheet) return null;
  if (user.role === "admin") return sheet;
  if (!userIsMember(sheet, user._id)) return null;
  const st = effectiveStatus(sheet);
  if (st === "pending" || st === "rejected") return sheet;
  if (st === "approved" && effectiveMemberIds(sheet).length === 1) return sheet;
  return null;
}

/** Client listing: member of sheet OR legacy owner-only row. */
function listSheetsQueryForClient(userId) {
  return {
    $or: [
      { memberIds: userId },
      {
        ownerId: userId,
        $or: [{ memberIds: { $exists: false } }, { memberIds: { $eq: [] } }],
      },
    ],
  };
}

export const listSheets = async (req, res) => {
  try {
    const query =
      req.user.role === "admin" ? {} : listSheetsQueryForClient(req.user._id);
    if (req.user.role === "admin" && req.query.status) {
      const s = String(req.query.status);
      if (["pending", "approved", "rejected"].includes(s)) {
        query.status = s;
      }
    }
    let q = Sheet.find(query).sort({ updatedAt: -1 });
    if (req.user.role === "admin") {
      q = q.populate("ownerId", "name surname email role").populate("memberIds", "name surname email role");
    }
    const sheets = await q.lean();
    return ok(res, sheets, "Sheets loaded");
  } catch (e) {
    return fail(res, e.message || "Failed to list sheets", 500);
  }
};

function dedupeObjectIds(ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    const s = id.toString();
    if (!seen.has(s)) {
      seen.add(s);
      out.push(typeof id === "string" ? new mongoose.Types.ObjectId(id) : id);
    }
  }
  return out;
}

export const createSheet = async (req, res) => {
  try {
    const { name, description, projectId, columns, assignment, userIds } = req.body;
    if (!name || typeof name !== "string") {
      return fail(res, "Name is required");
    }
    const cols = Array.isArray(columns) && columns.length > 0 ? normalizeColumns(columns) : defaultColumns();

    if (req.user.role === "admin") {
      const mode = assignment === "selected" || assignment === "all" || assignment === "admin_only" ? assignment : null;
      if (!mode) {
        return fail(res, "assignment is required: admin_only, selected, or all");
      }

      let memberIds = [];

      if (mode === "admin_only") {
        memberIds = [req.user._id];
      } else if (mode === "all") {
        // Snapshot at creation: new users registered later are not auto-added.
        const everyone = await User.find().select("_id").lean();
        memberIds = everyone.map((u) => u._id);
        if (memberIds.length === 0) {
          return fail(res, "No users in the system to assign");
        }
      } else if (mode === "selected") {
        if (!Array.isArray(userIds) || userIds.length === 0) {
          return fail(res, "userIds array is required when assignment is selected");
        }
        const valid = userIds.filter((id) => mongoose.isValidObjectId(id));
        if (valid.length === 0) return fail(res, "No valid user ids in userIds");
        const unique = [...new Set(valid.map((id) => String(id)))];
        const users = await User.find({ _id: { $in: unique } }).select("_id");
        if (users.length !== unique.length) {
          return fail(res, "One or more user ids were not found");
        }
        memberIds = dedupeObjectIds(users.map((u) => u._id));
      }

      memberIds = dedupeObjectIds(memberIds);
      const ownerId = memberIds[0];

      const sheet = await Sheet.create({
        name: name.trim(),
        description: description ?? "",
        ownerId,
        memberIds,
        projectId: projectId || null,
        columns: cols,
        status: "approved",
        createdById: req.user._id,
      });
      return ok(res, sheet, "Sheet created and assigned", 201);
    }

    const memberIds = [req.user._id];
    const sheet = await Sheet.create({
      name: name.trim(),
      description: description ?? "",
      ownerId: req.user._id,
      memberIds,
      projectId: projectId || null,
      columns: cols,
      status: "pending",
      createdById: req.user._id,
    });
    return ok(res, sheet, "Submitted for admin approval.", 201);
  } catch (e) {
    return fail(res, e.message || "Failed to create sheet", 500);
  }
};

const ALLOWED_TYPES = new Set(["text", "number", "date", "dropdown", "checkbox", "email", "formula"]);

function normalizeColumns(columns) {
  return columns.map((c, i) => {
    const type = c.type && ALLOWED_TYPES.has(c.type) ? c.type : "text";
    return {
      id: c.id || crypto.randomUUID(),
      name: String(c.name || `Column ${i + 1}`),
      type,
      options: Array.isArray(c.options) ? c.options.map(String) : [],
      order: typeof c.order === "number" ? c.order : i,
    };
  });
}

export const getSheet = async (req, res) => {
  try {
    const sheet = await getSheetForUser(req.params.id, req.user);
    if (!sheet) return fail(res, "Sheet not found", 404);
    return ok(res, sheet, "Sheet loaded");
  } catch (e) {
    return fail(res, e.message || "Failed to load sheet", 500);
  }
};

export const updateSheet = async (req, res) => {
  try {
    const sheet = await getSheetForUser(req.params.id, req.user);
    if (!sheet) return fail(res, "Sheet not found", 404);

    const { name, description, projectId, columns } = req.body;
    if (name !== undefined) sheet.name = String(name).trim();
    if (description !== undefined) sheet.description = String(description);
    if (projectId !== undefined) sheet.projectId = projectId || null;
    if (columns !== undefined) {
      if (!Array.isArray(columns)) return fail(res, "columns must be an array");
      sheet.columns = normalizeColumns(columns);
    }
    await sheet.save();
    return ok(res, sheet, "Sheet updated");
  } catch (e) {
    return fail(res, e.message || "Failed to update sheet", 500);
  }
};

export const deleteSheet = async (req, res) => {
  try {
    const sheet = await getSheetForDeletion(req.params.id, req.user);
    if (!sheet) return fail(res, "Sheet not found", 404);
    await Row.deleteMany({ sheetId: sheet._id });
    await Sheet.deleteOne({ _id: sheet._id });
    return ok(res, null, "Sheet deleted");
  } catch (e) {
    return fail(res, e.message || "Failed to delete sheet", 500);
  }
};

export const approveSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findById(req.params.id);
    if (!sheet) return fail(res, "Sheet not found", 404);
    if (effectiveStatus(sheet) === "pending") {
      sheet.status = "approved";
      await sheet.save();
    } else if (effectiveStatus(sheet) !== "approved") {
      return fail(res, "Only pending sheets can be approved from this action");
    }
    return ok(res, sheet, "Sheet approved");
  } catch (e) {
    return fail(res, e.message || "Failed to approve sheet", 500);
  }
};

export const rejectSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findById(req.params.id);
    if (!sheet) return fail(res, "Sheet not found", 404);
    if (effectiveStatus(sheet) !== "pending") {
      return fail(res, "Only pending sheets can be rejected");
    }
    sheet.status = "rejected";
    await sheet.save();
    return ok(res, sheet, "Sheet rejected");
  } catch (e) {
    return fail(res, e.message || "Failed to reject sheet", 500);
  }
};
