let apiPromise = null

export default function loadYouTubeIframeAPI() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT)
  }

  if (apiPromise) {
    return apiPromise
  }

  apiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady

    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback()
      resolve(window.YT)
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })

  return apiPromise
}
