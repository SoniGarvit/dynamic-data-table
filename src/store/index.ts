import { configureStore, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RowData, ColumnDef } from "../types";

const sampleData: RowData[] = [
  {
    id: "1",
    name: "Alice",
    email: "alice@example.com",
    age: 27,
    role: "Admin",
  },
  {
    id: "2",
    name: "John",
    email: "john@example.com",
    age: 28,
    role: "IT",
  },
  {
    id: "3",
    name: "Doby",
    email: "doby@example.com",
    age: 29,
    role: "Operations",
  },
];

const defaultColumns: ColumnDef[] = [
  { key: "name", label: "Name", visible: true },
  { key: "email", label: "Email", visible: true },
  { key: "age", label: "Age", visible: true },
  { key: "role", label: "Role", visible: true },
];

function loadState<T>(key: string, fallback: T) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    return fallback;
  }
}

const dataSlice = createSlice({
  name: "data",
  initialState: {
    rows: loadState<RowData[]>("table_rows", sampleData),
  },
  reducers: {
    setRows(state, action: PayloadAction<RowData[]>) {
      state.rows = action.payload;
      localStorage.setItem("table_rows", JSON.stringify(state.rows));
    },
    updateRow(state, action: PayloadAction<RowData>) {
      const idx = state.rows.findIndex((r) => r.id === action.payload.id);
      if (idx >= 0) state.rows[idx] = action.payload;
      localStorage.setItem("table_rows", JSON.stringify(state.rows));
    },
    deleteRow(state, action: PayloadAction<string>) {
      state.rows = state.rows.filter((r) => r.id !== action.payload);
      localStorage.setItem("table_rows", JSON.stringify(state.rows));
    },
  },
});

const columnSlice = createSlice({
  name: "column",
  initialState: {
    columns: loadState<ColumnDef[]>("table_columns", defaultColumns),
  },
  reducers: {
    toggleColumn(state, action: PayloadAction<string>) {
      const c = state.columns.find((col) => col.key === action.payload);
      if (c) c.visible = !c.visible;
      localStorage.setItem("table_columns", JSON.stringify(state.columns));
    },
    addColumn(state, action: PayloadAction<ColumnDef>) {
      state.columns.push(action.payload);
      localStorage.setItem("table_columns", JSON.stringify(state.columns));
    },
    setColumns(state, action: PayloadAction<ColumnDef[]>) {
      state.columns = action.payload;
      localStorage.setItem("table_columns", JSON.stringify(state.columns));
    },
  },
});

export const { setRows, updateRow, deleteRow } = dataSlice.actions;
export const { toggleColumn, addColumn, setColumns } = columnSlice.actions;

export const store = configureStore({
  reducer: {
    data: dataSlice.reducer,
    columns: columnSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
