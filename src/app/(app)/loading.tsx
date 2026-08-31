export default function Loading() {
  return (
    <div className="page-wrap" aria-label="Loading control center" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="metric-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
