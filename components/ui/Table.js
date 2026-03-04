'use client';

export default function Table({ columns, data, onRowClick, emptyMessage = '데이터가 없습니다.' }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">{emptyMessage}</div>
    );
  }

  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-3 text-left font-semibold text-gray-600 bg-gray-50/50 whitespace-nowrap ${col.className || ''} ${col.align === 'right' ? 'text-right' : ''} ${col.align === 'center' ? 'text-center' : ''}`}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-gray-50 ${onRowClick ? 'cursor-pointer hover:bg-primary-light/30' : ''} transition-colors`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-3 ${col.align === 'right' ? 'text-right' : ''} ${col.align === 'center' ? 'text-center' : ''} ${col.cellClass || ''}`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
