// =====================================================================
// usePagination — encapsulates the local page/size state.
// =====================================================================

import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialPageSize);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  const next = useCallback(() => setPage((p) => p + 1), []);
  const previous = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goTo = useCallback((p) => setPage(Math.max(1, p)), []);

  const meta = useMemo(() => ({ page, limit }), [page, limit]);

  return { page, limit, setLimit, setPage, goTo, next, previous, reset, meta };
}

export default usePagination;
