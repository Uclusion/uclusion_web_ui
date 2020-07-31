import React from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';

function MoviePlayer(props) {
  const { autoPlay, url, onFinish, poster } = props;

  return (
    <ReactPlayer
      url={url}
      light={poster}
      controls
      playing={autoPlay}
      width='100%'
      height='100%'
      onEnded={onFinish}
    />
  );
}

MoviePlayer.propTypes = {
  url: PropTypes.string.isRequired,
  autoPlay: PropTypes.bool.isRequired,
};

export default MoviePlayer;
