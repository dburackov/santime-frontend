import './Skeleton.css';

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-block skeleton-card__photo" />
      <div className="skeleton-block" style={{ width: '80%', height: 14 }} />
      <div className="skeleton-block" style={{ width: '50%', height: 12 }} />
      <div className="skeleton-block" style={{ width: '40%', height: 18 }} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="skeleton-row">
      <div className="skeleton-block skeleton-row__photo" />
      <div className="skeleton-row__main">
        <div className="skeleton-block" style={{ width: '60%', height: 14 }} />
        <div className="skeleton-block" style={{ width: '30%', height: 12 }} />
      </div>
      <div className="skeleton-block" style={{ width: 80, height: 18 }} />
    </div>
  );
}
