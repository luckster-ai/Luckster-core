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

export function formatVideoDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = String(seconds % 60).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${remainingSeconds}`
  }

  return `${minutes}:${remainingSeconds}`
}