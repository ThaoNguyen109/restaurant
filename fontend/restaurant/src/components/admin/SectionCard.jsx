function SectionCard({ title, subtitle, action, children }) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  )
}

export default SectionCard
