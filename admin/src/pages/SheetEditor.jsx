import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import api from "../api/client.js";
import { evaluateFormula } from "../utils/formula.js";
import { Button } from "../ui/Button.jsx";

ModuleRegistry.registerModules([AllCommunityModule]);

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

function rowsToGridData(apiRows) {
  const byId = new Map(apiRows.map((r) => [r._id.toString(), r]));
  return apiRows.map((r) => {
    const flat = { rowId: r._id, path: buildPath(r, byId), isLocked: r.isLocked, order: r.order };
    for (const c of r.cells || []) {
      flat[c.columnId] = c.value;
    }
    return flat;
  });
}

function buildPath(row, byId) {
  const path = [];
  let cur = row;
  while (cur) {
    path.unshift(cur._id.toString());
    cur = cur.parentRowId ? byId.get(cur.parentRowId.toString()) : null;
  }
  return path;
}

function gridRowToCells(sheet, flatRow) {
  return sheet.columns.map((col) => {
    const v = flatRow[col.id];
    if (col.type === "formula") {
      return { columnId: col.id, value: v, formula: typeof v === "string" && v.startsWith("=") ? v : undefined };
    }
    return { columnId: col.id, value: v ?? null };
  });
}

export default function SheetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const gridApiRef = useRef(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sRes, rRes] = await Promise.all([
        api.get(`/api/sheets/${id}`),
        api.get(`/api/sheets/${id}/rows`),
      ]);
      setSheet(sRes.data);
      setRows(rRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load");
      setSheet(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const rowData = useMemo(() => rowsToGridData(rows), [rows]);

  const columnDefs = useMemo(() => {
    if (!sheet?.columns) return [];
    const sorted = [...sheet.columns].sort((a, b) => a.order - b.order);
    return sorted.map((col) => {
      const base = {
        field: col.id,
        headerName: col.name,
        sortable: true,
        resizable: true,
        editable: (p) => !p.data?.isLocked,
      };
      switch (col.type) {
        case "number":
          return { ...base, cellEditor: "agNumberCellEditor", valueParser: (p) => (p.newValue === "" ? null : Number(p.newValue)) };
        case "date":
          return { ...base, cellEditor: "agDateCellEditor" };
        case "checkbox":
          return {
            ...base,
            cellEditor: "agCheckboxCellEditor",
            valueFormatter: (p) => (p.value ? "Yes" : "No"),
          };
        case "dropdown":
          return {
            ...base,
            cellEditor: "agSelectCellEditor",
            cellEditorParams: { values: col.options?.length ? col.options : ["—"] },
          };
        case "email":
          return { ...base };
        case "formula":
          return {
            ...base,
            valueFormatter: (p) => {
              const raw = p.value;
              if (raw == null || raw === "") return "";
              const ev = evaluateFormula(raw);
              return raw.startsWith("=") ? ev : raw;
            },
          };
        default:
          return { ...base, cellEditor: "agTextCellEditor" };
      }
    });
  }, [sheet]);

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
    }),
    []
  );

  const onCellValueChanged = useCallback(
    async (ev) => {
      if (!sheet || ev.data?.isLocked) return;
      const flatRow = ev.data;
      const rowId = flatRow.rowId;
      const cells = gridRowToCells(sheet, flatRow);
      try {
        await api.put(`/api/sheets/${id}/rows/${rowId}`, { cells });
        await loadAll();
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Save failed");
      }
    },
    [sheet, id, loadAll]
  );

  const addRootRow = async () => {
    if (!sheet) return;
    const cells = sheet.columns.map((c) => ({ columnId: c.id, value: c.type === "checkbox" ? false : "" }));
    try {
      await api.post(`/api/sheets/${id}/rows`, { cells, parentRowId: null });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add row");
    }
  };

  const onGridReady = (e) => {
    gridApiRef.current = e.api;
  };

  const addChildRow = async () => {
    const apiG = gridApiRef.current;
    const selected = apiG?.getSelectedRows?.()?.[0];
    const parentId = selected?.rowId;
    if (!sheet || !parentId) {
      setError("Select a row to add a child under.");
      return;
    }
    setError("");
    const cells = sheet.columns.map((c) => ({ columnId: c.id, value: c.type === "checkbox" ? false : "" }));
    try {
      await api.post(`/api/sheets/${id}/rows`, { cells, parentRowId: parentId });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add child row");
    }
  };

  const deleteSelected = async () => {
    const apiG = gridApiRef.current;
    if (!apiG) return;
    const sel = apiG.getSelectedRows?.()?.[0];
    if (!sel?.rowId) return;
    if (!window.confirm("Delete this row and its children?")) return;
    try {
      await api.delete(`/api/sheets/${id}/rows/${sel.rowId}`);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Delete failed");
    }
  };

  const addColumn = async () => {
    if (!sheet) return;
    const name = window.prompt("Column name", `Column ${sheet.columns.length + 1}`);
    if (!name) return;
    const type = window.prompt("Type: text, number, date, dropdown, checkbox, email, formula", "text");
    if (!type) return;
    const allowed = ["text", "number", "date", "dropdown", "checkbox", "email", "formula"];
    const t = allowed.includes(type) ? type : "text";
    const newCol = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type: t,
      options: t === "dropdown" ? ["Option A", "Option B"] : [],
      order: sheet.columns.length,
    };
    const columns = [...sheet.columns, newCol];
    try {
      await api.put(`/api/sheets/${id}`, { columns });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add column");
    }
  };

  const onColumnMoved = async (ev) => {
    if (!sheet || ev.finished !== true) return;
    const ordered = ev.api.getAllDisplayedColumns();
    const fieldOrder = ordered.map((c) => c.getColId()).filter((fid) => fid && fid !== "ag-Grid-AutoColumn");
    const map = new Map(sheet.columns.map((c) => [c.id, c]));
    const columns = fieldOrder.map((fid, i) => {
      const c = map.get(fid);
      return c ? { ...c, order: i } : null;
    }).filter(Boolean);
    if (columns.length !== sheet.columns.length) return;
    try {
      await api.put(`/api/sheets/${id}`, { columns });
      setSheet((s) => (s ? { ...s, columns } : s));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Reorder failed");
    }
  };

  const onRowDragEnd = async (ev) => {
    const node = ev.node;
    const rowId = node.data?.rowId;
    if (!rowId) return;
    const parentData = node.parent?.data;
    const newParentId = parentData?.rowId ?? null;
    try {
      const siblings = [];
      const parentNode = node.parent;
      if (parentNode?.childrenAfterSort) {
        parentNode.childrenAfterSort.forEach((n, i) => {
          if (n.data?.rowId) siblings.push({ rowId: n.data.rowId, order: i });
        });
      }
      await api.put(`/api/sheets/${id}/rows/${rowId}`, {
        parentRowId: newParentId,
        order: siblings.findIndex((s) => s.rowId.toString() === rowId.toString()),
      });
      for (const s of siblings) {
        await api.put(`/api/sheets/${id}/rows/${s.rowId}`, { order: s.order });
      }
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Reorder failed");
    }
  };

  const deleteSheet = async () => {
    if (!window.confirm("Delete this sheet permanently?")) return;
    try {
      await api.delete(`/api/sheets/${id}`);
      navigate("/sheets");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Delete failed");
    }
  };

  if (loading && !sheet) {
    return (
      <div className="sheet-editor">
        <p className="sf-muted">Loading…</p>
      </div>
    );
  }

  if (error && !sheet) {
    return (
      <div className="sheet-editor">
        <p className="sf-error">{error}</p>
        <Link to="/sheets">Back to sheets</Link>
      </div>
    );
  }

  return (
    <div className="sheet-editor">
      <header className="sf-toolbar">
        <div>
          <h1 className="sf-sheet-title">{sheet?.name}</h1>
        </div>
        <div className="sf-toolbar-actions">
          <Button type="button" variant="secondary" onClick={addRootRow}>
            Add row
          </Button>
          <Button type="button" variant="secondary" onClick={addChildRow}>
            Add child row
          </Button>
          <Button type="button" variant="secondary" onClick={deleteSelected}>
            Delete selected
          </Button>
          <Button type="button" variant="secondary" onClick={addColumn}>
            Add column
          </Button>
          <Button type="button" variant="danger" onClick={deleteSheet}>
            Delete sheet
          </Button>
        </div>
      </header>
      {error && <p className="sf-error">{error}</p>}

      <div className="sf-grid-wrap ag-theme-quartz" style={{ height: 560, width: "100%" }}>
        <AgGridReact
          onGridReady={onGridReady}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          treeData
          getDataPath={(data) => data.path}
          autoGroupColumnDef={{
            headerName: "",
            rowDrag: true,
            minWidth: 200,
            cellRendererParams: { suppressCount: true },
          }}
          rowSelection={{ mode: "singleRow" }}
          onCellValueChanged={onCellValueChanged}
          onColumnMoved={onColumnMoved}
          onRowDragEnd={onRowDragEnd}
          animateRows
          suppressRowClickSelection={false}
        />
      </div>
    </div>
  );
}
