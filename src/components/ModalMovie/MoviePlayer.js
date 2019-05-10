import React from 'react';
import PropTypes from 'prop-types';
import '../../../node_modules/video-react/dist/video-react.css';
import { Player } from 'video-react';

function MoviePlayer(props){
  const { autoPlay, url } = props;

  return (
    <Player src={url} autoPlay={autoPlay}/>
  );
}

MoviePlayer.propTypes = {
  url: PropTypes.string.isRequired,
  autoPlay: PropTypes.bool.isRequired,
};

export default MoviePlayer;
