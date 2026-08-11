// =====================================================================
// ProjectDetailPage — placeholder.
// =====================================================================

import { useParams } from 'react-router-dom';
import PageContainer from '../../layouts/PageContainer';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  return (
    <PageContainer
      title={`Project ${projectId}`}
      subtitle="Project overview, tasks, and team"
    >
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-6 text-sm text-text-muted">
        Project detail view coming soon.
      </div>
    </PageContainer>
  );
}
