import { useState } from 'react';

interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  defaultSortKey?: string;
  defaultSortDesc?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  defaultSortKey,
  defaultSortDesc = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSortKey || columns[0]?.key || '');
  const [sortDesc, setSortDesc] = useState(defaultSortDesc);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return 0;
    const aVal = col.sortValue(a);
    const bVal = col.sortValue(b);
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDesc ? bVal - aVal : aVal - bVal;
    }
    return sortDesc
      ? String(bVal).localeCompare(String(aVal))
      : String(aVal).localeCompare(String(bVal));
  });

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="text-dashboard-text-muted border-b border-dashboard-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`pb-2 pr-4 font-medium cursor-pointer hover:text-dashboard-text-primary transition-colors ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }`}
                onClick={() => col.sortValue && handleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="ml-1 text-xs">{sortDesc ? ' v' : ' ^'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr key={i} className="border-b border-dashboard-border/50 text-dashboard-text-primary">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-2.5 pr-4 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
