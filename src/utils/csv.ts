import Papa from "papaparse";
import type { RowData } from "../types";

export function parseCSV(text: string): { data: RowData[]; errors: string[] } {
  const res = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const errors: string[] = [];
  const parsed: RowData[] = res.data.map((r, i) => {
    if (!r["name"] || !r["email"])
      errors.push(`Row ${i + 1}:missing name or email`);

    return {
      id: r["id"] || `${Date.now()}-${i}`,
      name: r["name"] || "",
      email: r["email"] || "",
      age: r["age"] || 0,
      role: r["role"] || "Viewer",
      ...r,
    };
  });
  return { data: parsed, errors };
}

export function exportCSV(rows: RowData[], visibleKeys: string[]) {
  const data = rows.map((r) => {
    const out: Record<string, any> = {};
    visibleKeys.forEach((item) => (out[item] = r[item]));
    return out;
  });

  const csv = Papa.unparse(data);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
