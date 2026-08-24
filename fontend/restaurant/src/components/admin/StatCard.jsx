function StatCard({ title, value, subtitle, trend, tone = 'blue' }) {
  const toneClass = {
    blue: 'stat-card--blue',
    green: 'stat-card--green',
    orange: 'stat-card--orange',
    purple: 'stat-card--purple',
  }[tone] || 'stat-card--blue'

  return (
    <article className={`stat-card ${toneClass}`}>
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        <span className="stat-card__trend">{trend}</span>
      </div>
      <div className="stat-card__value">{value}</div>
      <p className="stat-card__subtitle">{subtitle}</p>
    </article>
  )
}

export default StatCard
