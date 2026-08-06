export function stripMarkdownSection(markdown, headingPattern) {
  return markdown.replace(
    new RegExp(`${headingPattern}[\\s\\S]*?(?=\\n#{2,3}\\s|\\s*$)`),
    ''
  )
}
