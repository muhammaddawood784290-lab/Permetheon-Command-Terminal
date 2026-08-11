// =====================================================================
// TaskDetailPage — placeholder.
// =====================================================================

import { useParams } from 'react-router-dom';
import PageContainer from '../../layouts/PageContainer';

export default function TaskDetailPage() {
  const { taskId } = useParams();
  return (
    <PageContainer title={`Task ${taskId}`} subtitle="Details, comments, files, and reviews">
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-6 text-sm text-text-muted">
        Task detail view coming soon.
      </div>
    </PageContainer>
  );
}
