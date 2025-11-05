// File: src/App.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setRows,
  updateRow,
  deleteRow,
  toggleColumn,
  addColumn,
  setColumns,
} from "./store";
import type { RootState } from "./store";
import type { RowData } from "./types";
import {
  Box,
  Container,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Stack,
  useMediaQuery,
  Switch,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { parseCSV, exportCSV } from "./utils/csv";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export default function App() {
  const dispatch = useDispatch();
  const rows = useSelector((s: RootState) => s.data.rows);
  const columns = useSelector((s: RootState) => s.columns.columns);

  // UI state
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [rowsPerPage] = useState(5); // CHANGED: rows per page set to 5 as requested
  const [manageOpen, setManageOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCache, setEditCache] = useState<Record<string, any>>({});

  // sorting
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // theme toggle (light / dark)
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light"); // CHANGED: added theme toggle state
  const theme = useMemo(
    () => createTheme({ palette: { mode: themeMode } }),
    [themeMode]
  );

  // responsive
  const isSmall = useMediaQuery("(max-width:600px)");

  // column reordering drag index
  const [dragColIndex, setDragColIndex] = useState<number | null>(null);

  const visibleCols = useMemo(
    () => columns.filter((c) => c.visible),
    [columns]
  );

  // FETCH DATA FROM JSONPLACEHOLDER and save into state
  useEffect(() => {
    // CHANGED: Fetching user data from jsonplaceholder.typicode.com/users and saving into Redux state
    // We map the received user objects to our RowData shape and add simple defaults for missing fields.
    async function fetchUsers() {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        const data = await res.json();
        const mapped: RowData[] = data.map((u: any, i: number) => ({
          id: String(u.id),
          name: u.name || u.username || `User ${i + 1}`,
          email: u.email || `user${i + 1}@example.com`,
          age: Math.floor(Math.random() * 43) + 18, // random age 18-60
          role: "Viewer",
          phone: u.phone,
          website: u.website,
          company: u.company?.name,
          address: `${u.address?.city || ""}`,
        }));
        dispatch(setRows(mapped));
      } catch (e) {
        console.error("Failed to fetch users", e);
      }
    }
    fetchUsers();
  }, [dispatch]);

  // filtering & sorting
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let data = rows.filter((r) => {
      if (!q) return true;
      return Object.values(r).some((v) => String(v).toLowerCase().includes(q));
    });
    if (sortKey) {
      data = data.slice().sort((a, b) => {
        const av = (a as any)[sortKey];
        const bv = (b as any)[sortKey];
        if (av === bv) return 0;
        // handle undefined gracefully
        if (av == null) return sortDir === "asc" ? -1 : 1;
        if (bv == null) return sortDir === "asc" ? 1 : -1;
        const res = av > bv ? 1 : -1;
        return sortDir === "asc" ? res : -res;
      });
    }
    return data;
  }, [rows, search, sortKey, sortDir]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  // handlers
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const { data, errors } = parseCSV(text);
      if (errors.length) setImportErrors(errors);
      dispatch(setRows(data));
      setManageOpen(false);
    };
    reader.readAsText(file);
  }

  function handleExport() {
    const visibleKeys = visibleCols.map((c) => c.key);
    const blob = exportCSV(filtered, visibleKeys);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDoubleClick(row: RowData) {
    setEditingId(row.id);
    setEditCache(row);
  }

  function saveEdit() {
    if (!editingId) return;
    const cache = editCache as RowData;
    if (Number.isNaN(Number(cache.age))) return alert("Age must be a number");
    dispatch(updateRow(cache));
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditCache({});
  }

  // CHANGED: column header click sort handler (sorting for each column header)
  function handleHeaderSort(key: string) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // CHANGED: drag & drop handlers to reorder columns
  function onDragStart(e: React.DragEvent, index: number) {
    setDragColIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragColIndex == null) return;
    const newCols = [...columns];
    const [moved] = newCols.splice(dragColIndex, 1);
    newCols.splice(index, 0, moved);
    dispatch(setColumns(newCols)); // persist new order
    setDragColIndex(null);
  }

  return (
    // CHANGED: ThemeProvider added here so user can toggle light/dark without changing main.tsx
    <ThemeProvider theme={theme}>
      <Container sx={{ mt: 4, maxWidth: "xl" }}>
        <Paper sx={{ p: 2, mb: 2, boxShadow: 3 }}>
          <Stack
            direction={isSmall ? "column" : "row"}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="Global search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              sx={{ flex: 1, minWidth: 160 }}
            />

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => setManageOpen(true)}>
                Manage Columns
              </Button>
              <Button variant="outlined" component="label">
                Import CSV
                <input
                  hidden
                  type="file"
                  accept=".csv"
                  onChange={handleImportFile}
                />
              </Button>
              <Button variant="contained" onClick={handleExport}>
                Export CSV
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ mr: 1 }}>Theme</Box>
              <Switch
                checked={themeMode === "dark"}
                onChange={(e) =>
                  setThemeMode(e.target.checked ? "dark" : "light")
                }
              />
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ overflowX: "auto", mb: 2 }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableCell
                    key={col.key}
                    draggable
                    onDragStart={(e) => onDragStart(e, idx)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, idx)}
                    onClick={() => handleHeaderSort(col.key)} // CHANGED: make header clickable for sorting
                    sx={{
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}
                    {sortKey === col.key
                      ? sortDir === "asc"
                        ? " ▲"
                        : " ▼"
                      : ""}
                  </TableCell>
                ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.map((row) => (
                <TableRow
                  key={row.id}
                  onDoubleClick={() => handleDoubleClick(row)}
                  hover
                >
                  {columns
                    .filter((c) => c.visible)
                    .map((col) => (
                      <TableCell key={col.key} sx={{ minWidth: 120 }}>
                        {editingId === row.id ? (
                          <TextField
                            value={
                              (editCache as any)[col.key] ??
                              (row as any)[col.key] ??
                              ""
                            }
                            onChange={(e) =>
                              setEditCache((prev) => ({
                                ...prev,
                                [col.key]: e.target.value,
                              }))
                            }
                            size="small"
                          />
                        ) : (
                          String((row as any)[col.key] ?? "")
                        )}
                      </TableCell>
                    ))}

                  <TableCell>
                    {editingId === row.id ? (
                      <>
                        <Button size="small" onClick={saveEdit}>
                          Save
                        </Button>
                        <Button size="small" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={() => {
                            setEditingId(row.id);
                            setEditCache(row);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            if (confirm("Delete row?"))
                              dispatch(deleteRow(row.id));
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5]}
          />
        </Paper>

        <Dialog
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          fullWidth
        >
          <DialogTitle>Manage Columns</DialogTitle>
          <DialogContent>
            {columns.map((c) => (
              <FormControlLabel
                key={c.key}
                control={
                  <Checkbox
                    checked={c.visible}
                    onChange={() => dispatch(toggleColumn(c.key))}
                  />
                }
                label={c.label}
              />
            ))}
            <Box sx={{ mt: 2 }}>
              <TextField
                id="new-col-label"
                label="New column label"
                size="small"
              />
              <Button
                sx={{ ml: 1 }}
                onClick={() => {
                  const el = document.getElementById(
                    "new-col-label"
                  ) as HTMLInputElement | null;
                  if (!el) return;
                  const label = el.value.trim();
                  if (!label) return;
                  const key = label.toLowerCase().replace(/\s+/g, "_");
                  dispatch(addColumn({ key, label, visible: true }));
                  el.value = "";
                }}
              >
                Add
              </Button>
            </Box>

            {importErrors && (
              <Box sx={{ color: "error.main", mt: 2 }}>
                <strong>Import errors:</strong>
                <ul>
                  {importErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <em>
                Tip: Drag table headers to reorder columns (changes persist).
              </em>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManageOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}
