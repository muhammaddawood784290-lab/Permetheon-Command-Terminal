// =====================================================================
// Skeleton — placeholder while data is loading.
// =====================================================================

import { cn } from '../../utils/cn';

export default function Skeleton({ className, ...rest }) {
  return <div className={cn('pct-skeleton', className)} {...rest} />;
}
