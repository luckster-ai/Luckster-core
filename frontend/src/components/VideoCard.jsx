function VideoCard({ video }) {
  return (
    <div className="card">
      <h3>{video.title}</h3>

      <p>{video.platform}</p>
    </div>
  )
}

export default VideoCard