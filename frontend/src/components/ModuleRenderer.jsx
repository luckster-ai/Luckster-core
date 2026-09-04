import VideoModule from './VideoModule'
import ModulePlaceholder from './ModulePlaceholder'

function ModuleRenderer({
  module,
  onEnded,
  onImmersiveStart,
  onPlaybackStarted,
  progressSessionId,
  progressModuleIndex,
  initialPositionSeconds
}) {
  const hasVideo = Boolean(module.videoReference?.videoId)

  if (hasVideo) {
    return (
      <VideoModule
        module={module}
        onEnded={onEnded}
        onImmersiveStart={onImmersiveStart}
        onPlaybackStarted={onPlaybackStarted}
        progressSessionId={progressSessionId}
        progressModuleIndex={progressModuleIndex}
        initialPositionSeconds={initialPositionSeconds}
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
