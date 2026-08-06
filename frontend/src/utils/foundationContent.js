const markdownModules = import.meta.glob(
  '../content/foundations/**/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

export function getMarkdown(path) {
  return markdownModules[path] || ''
}
