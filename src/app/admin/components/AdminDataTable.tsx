import type { ReactNode } from "react";

export interface AdminDataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export default function AdminDataTable<T>({
  columns,
  rows,
  emptyText = "No data available.",
}: {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  emptyText?: string;
}) {
  // Safe array handling - prevent crash if data is undefined/null
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="overflow-hidden border border-border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="border-b border-border-line bg-background-soft">
            <tr>
              {safeColumns.map((column) => (
                <th key={column.key} className={`px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-secondary ${column.className || ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.length === 0 ? (
              <tr>
                <td colSpan={safeColumns.length} className="px-5 py-10 text-center text-sm text-foreground-secondary">
                  {emptyText}
                </td>
              </tr>
            ) : (
              safeRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border-line last:border-b-0 hover:bg-background-soft/70">
                  {safeColumns.map((column) => (
                    <td key={column.key} className={`px-5 py-4 text-sm text-foreground ${column.className || ""}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}