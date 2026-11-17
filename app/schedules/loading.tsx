export default function SchedulesLoading() {
  return (
    <div className="page-content" aria-busy="true">
      <div className="skeleton-line skeleton-title" />
      <div className="card schedule-loading-card">
        <div className="skeleton-line" />
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    </div>
  );
}
