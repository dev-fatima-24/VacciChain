import { useState, useMemo } from 'react';

export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const currentItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  // Reset to page 1 when items change (e.g. new wallet loaded)
  const reset = () => setPage(1);

  return { currentItems, page, totalPages, goTo, reset, total: items.length };
}
