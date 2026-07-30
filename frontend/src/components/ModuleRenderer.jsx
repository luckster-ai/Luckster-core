import VideoModule from './VideoModule'
import ModulePlaceholder from './ModulePlaceholder'

function ModuleRenderer({ module, onEnded }) {
  const hasVideo = Boolean(module.videoReference?.videoId)

  if (hasVideo) {
    return <VideoModule module={module} onEnded={onEnded} />
  }

  return <ModulePlaceholder module={module} onEnded={onEnded} />
}

export default ModuleRenderer
