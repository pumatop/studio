import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCsv<T extends object>(filename: string, rows: T[]) {
  if (!rows || !rows.length) {
    return;
  }
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k as keyof T] as string | number | boolean | null | undefined;
        if (cell === null || cell === undefined) {
          cell = '';
        }
        let cellString = String(cell);

        if (cellString.includes('"')) {
          cellString = `"${cellString.replace(/"/g, '""')}"`;
        }
        if (cellString.includes(separator)) {
          cellString = `"${cellString}"`;
        }

        return cellString;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
