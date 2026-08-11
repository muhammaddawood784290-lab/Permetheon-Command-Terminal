// =====================================================================
// ReviewDetailPage — placeholder.
// =====================================================================

import { useParams } from 'react-router-dom';
import PageContainer from '../../layouts/PageContainer';

export default function ReviewDetailPage() {
  const { reviewId } = useParams();
  return (
    <PageContainer title={`Review ${reviewId}`} subtitle="Submission, feedback, and decision">
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-6 text-sm text-text-muted">
        Review detail coming soon.
      </div>
    </PageContainer>
  );
}
