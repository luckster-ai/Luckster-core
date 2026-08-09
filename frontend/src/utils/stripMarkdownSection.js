export function stripMarkdownSection(markdown, headingPattern) {
  return markdown.replace(
    new RegExp(`${headingPattern}[\\s\\S]*?(?=\\n#{2,3}\\s|\\s*$)`),
    ''
  )
}

export function stripSectionIfEmpty(markdown, headingPattern) {
  const sectionRegex = new RegExp(
    `${headingPattern}[\\s\\S]*?(?=\\n#{1,3}\\s|\\s*$)`
  )
  const match = markdown.match(sectionRegex)

  if (!match) return markdown

  const section = match[0]
  const body = section
    .replace(new RegExp(headingPattern), '')
    .replace(/（未來 AI 自動建立）/g, '')
    .replace(/^[A-Za-z一-鿿]+[:：]\s*$/gm, '')
    .trim()

  if (body.length > 0) return markdown

  return markdown.replace(section, '')
}
