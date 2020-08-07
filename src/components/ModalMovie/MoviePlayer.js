import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ReactPlayer from 'react-player'

function MoviePlayer (props) {
  const { autoPlay, url, onFinish, poster } = props
  const [isPlaying, setIsPlaying] = useState(true)

  function myOnFinish () {
    setIsPlaying(false)
    onFinish()
  }

  return (
    <ReactPlayer
      url={url}
      light={poster}
      controls
      playing={autoPlay && isPlaying}
      width='90%'
      height='90%'
      stopOnUnmount={true}
      onEnded={myOnFinish}
    />
  );
}

MoviePlayer.propTypes = {
  url: PropTypes.string.isRequired,
  autoPlay: PropTypes.bool.isRequired,
};

export default MoviePlayer;
