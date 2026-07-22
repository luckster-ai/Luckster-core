export default function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const parts = []

  if (hours > 0) {
    parts.push(`${hours} hr`)
  }

  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes} min`)
  }

  parts.push(`${remainingSeconds} sec`)

  return parts.join(' ')
}