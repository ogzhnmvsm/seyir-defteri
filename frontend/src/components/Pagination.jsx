import { useState } from 'react';

/** Reusable client-side pagination hook */
export function usePagination(items, pageSize = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { page: safePage, setPage, totalPages, slice };
}

/** Render a simple pagination control below a list */
export function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button
        className="pag-btn"
        disabled={page === 1}
        onClick={() => setPage(1)}
      >«</button>
      <button
        className="pag-btn"
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
      >‹ Önceki</button>
      <span className="pag-info">{page} / {totalPages}</span>
      <button
        className="pag-btn"
        disabled={page === totalPages}
        onClick={() => setPage((p) => p + 1)}
      >Sonraki ›</button>
      <button
        className="pag-btn"
        disabled={page === totalPages}
        onClick={() => setPage(totalPages)}
      >»</button>
    </div>
  );
}
