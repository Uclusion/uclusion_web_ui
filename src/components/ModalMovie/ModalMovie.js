import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import MoviePlayer from './MoviePlayer';

function ModalMovie(props) {
  // console.log('Rerendered modal movie');
  const {
    url, onClose, autoPlay, open, poster
  } = props;
  const [amOpen, setAmOpen] = useState(false);

  function myOnClose() {
    setAmOpen(false);
    onClose();
  }


  useEffect(() => {
    setAmOpen(open);
  }, [open]);

  return (
    <Modal
      open={amOpen}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10%',
      }}
    >
      <div style={{ width: '100%', position: 'relative', outline: 'none' }}>
        <MoviePlayer
          autoPlay={autoPlay}
          url={url}
          poster={poster}
          onFinish={myOnClose}
        />
        <IconButton
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
          }}
          aria-label="Close"
          onClick={myOnClose}
        >
          <CloseIcon style={{ fontSize: 32, color: 'white' }} />
        </IconButton>
      </div>
    </Modal>
  );
}

ModalMovie.propTypes = {
  url: PropTypes.string.isRequired,
  poster: PropTypes.string,
  // eslint-disable-next-line react/require-default-props
  onClose: PropTypes.func,
  autoPlay: PropTypes.bool.isRequired,
  open: PropTypes.bool.isRequired,
};

ModalMovie.defaultProps = {
  poster: `${process.env.PUBLIC_URL}/images/video_poster.png`,
}


export default ModalMovie;
