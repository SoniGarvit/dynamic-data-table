export type RowData = {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any;
};

export type ColumnDef = {
  key: string;
  label: string;
  visible: boolean;
};
