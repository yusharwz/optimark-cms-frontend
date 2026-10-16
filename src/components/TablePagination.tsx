'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from '@untitledui/icons';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [25, 50, 100, 150],
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="px-4 sm:px-6 py-3.5 bg-white border-t border-[#eaecf0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#535862]">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          Menampilkan <span className="font-semibold text-[#181d27]">{startItem}</span> -{' '}
          <span className="font-semibold text-[#181d27]">{endItem}</span> dari{' '}
          <span className="font-semibold text-[#181d27]">{totalItems}</span> entri
        </div>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 text-xs text-[#535862]">
            <span>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                onItemsPerPageChange(val);
                onPageChange(1);
              }}
              className="bg-white border border-[#d5d7da] rounded-lg px-2 py-1 text-xs font-medium text-[#344054] focus:outline-none focus:ring-1 focus:ring-[#465984] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>per halaman</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#d5d7da] bg-white text-xs font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                p === currentPage
                  ? 'bg-[#465984] text-white shadow-2xs'
                  : 'text-[#535862] hover:bg-[#f2f4f7]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#d5d7da] bg-white text-xs font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
