import React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const DataTable = ({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  filters = [],
  pagination,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  emptyMessage = 'No records found matching your query.',
  actions,
}) => {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-sky-100 shadow-sm bg-white">
      {/* Top Filter and Search Bar */}
      {(onSearchChange || filters.length > 0 || actions) && (
        <div className="p-4 border-b border-sky-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {onSearchChange && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-sky-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition shadow-sm"
                />
              </div>
            )}

            {filters.map((filter, idx) => (
              <select
                key={idx}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="px-3 py-2 bg-white border border-sky-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-500 transition shadow-sm"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-sky-50/70 border-b border-sky-100 text-xs font-bold uppercase tracking-wider text-sky-950">
              {columns.map((col, idx) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={idx}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                    className={`py-3.5 px-4 ${
                      col.sortable ? 'cursor-pointer select-none hover:text-sky-600' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-sky-600 font-bold" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-sky-600 font-bold" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-50">
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-4">
                      <div className="h-4 bg-sky-100/60 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-500">
                  <p className="text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row._id || rIdx}
                  className="hover:bg-sky-50/40 transition-colors group text-slate-700"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-3.5 px-4 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-4 py-3 border-t border-sky-100 flex items-center justify-between text-xs text-slate-600 bg-sky-50/40">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total || 0)}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(pagination.page * pagination.limit, pagination.total || 0)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{pagination.total || 0}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
