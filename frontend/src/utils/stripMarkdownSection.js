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

// Body of a "## Heading" section, up to the next "---" rule or heading
// ('' when the section is missing).
export function getMarkdownSection(markdown, heading) {
  const match = markdown.match(
    new RegExp(`(?:^|\\n)##\\s*${heading}\\s*\\n([\\s\\S]*?)(?=\\n---|\\n#{1,3}\\s|$)`)
  )
  return match ? match[1].trim() : ''
}
