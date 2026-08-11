// =====================================================================
// SearchPage — global search results placeholder.
// =====================================================================

import { useSearchParams } from 'react-router-dom';
import PageContainer from '../../layouts/PageContainer';
import Input from '../../components/ui/Input';
import { useState, useEffect } from 'react';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');

  useEffect(() => {
    setQ(params.get('q') || '');
  }, [params]);

  const onSubmit = (e) => {
    e.preventDefault();
    setParams(q ? { q } : {});
  };

  return (
    <PageContainer title="Search" subtitle="Find projects, tasks, and users">
      <form onSubmit={onSubmit} className="max-w-xl mb-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          autoFocus
        />
      </form>
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-6 text-sm text-text-muted">
        {q ? `Searching for "${q}"…` : 'Type a query to begin searching.'}
      </div>
    </PageContainer>
  );
}
