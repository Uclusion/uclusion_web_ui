import React from 'react';
import PropTypes from 'prop-types';
import '../../../node_modules/video-react/dist/video-react.css';
import { Player } from 'video-react';

function MoviePlayer(props){
  const { autoPlay, url, onFinish } = props;

  let player = null;

  function handlePlayerStateChange(state, prevState){
    const { ended } = state;
    if (ended ){
      onFinish();
    }
  }

  function setPlayerRef(element) {
    player = element;
    if (player) {
      player.subscribeToStateChange(handlePlayerStateChange);
    }
  }

  return (
    <Player src={url} autoPlay={autoPlay} ref={setPlayerRef} />
  );
}

MoviePlayer.propTypes = {
  url: PropTypes.string.isRequired,
  autoPlay: PropTypes.bool.isRequired,
};

export default MoviePlayer;
