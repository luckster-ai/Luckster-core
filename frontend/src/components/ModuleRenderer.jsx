import VideoModule from './VideoModule'
import ModulePlaceholder from './ModulePlaceholder'

function ModuleRenderer({ module, onEnded, onImmersiveStart }) {
  const hasVideo = Boolean(module.videoReference?.videoId)

  if (hasVideo) {
    return (
      <VideoModule
        module={module}
        onEnded={onEnded}
        onImmersiveStart={onImmersiveStart}
      />
    )
  }

  return (
    <ModulePlaceholder
      key={module.slug}
      module={module}
      onEnded={onEnded}
    />
  )
}

export default ModuleRenderer
