function ExternalLinksSection({ homepage }) {
  return (
    <section className="external-links">
      <h2>{homepage.youtube.title}</h2>

      <div className="links">
        <a
          href={homepage.youtube.channelUrl}
          target="_blank"
          rel="noreferrer"
        >
          YouTube
        </a>
      </div>
    </section>
  )
}

export default ExternalLinksSection
