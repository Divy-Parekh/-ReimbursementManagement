export default function Table({ columns, data, onRowClick, emptyMessage = 'No data found', loading = false }) {
  if (loading) {
    return (
      <div className="glass rounded-xl overflow-hidden">
        <div className="animate-pulse p-6 space-y-4">
          <div className="h-4 bg-surface-600 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-surface-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider"
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-text-muted text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors duration-150 ${
                    onRowClick ? 'cursor-pointer hover:bg-surface-700/50' : ''
                  }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 text-sm text-text-primary whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
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
