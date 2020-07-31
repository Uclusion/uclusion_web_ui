import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import MoviePlayer from './MoviePlayer';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(() => {
  return {
    movieModal: {
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      alignItems: 'center',
    },
    movieContainer: {
      minHeight: '75vh',
      minWidth: '75vw',
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      alignItems: 'center',
      outline: '2',
    }
  };
});

function ModalMovie(props) {
  // console.log('Rerendered modal movie');
  const {
    url, onClose, autoPlay, open, poster, canClose
  } = props;

  const classes = useStyles();
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
      className={classes.movieContainer}
    >
      <div className={classes.movieContainer}>
        <MoviePlayer
          autoPlay={autoPlay}
          url={url}
          poster={poster}
          onFinish={myOnClose}
        />
        {canClose &&(
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
        )}
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
  canClose: PropTypes.bool,
};

ModalMovie.defaultProps = {
  canClose: true,
  poster: `${process.env.PUBLIC_URL}/images/video_poster.png`,
}


export default ModalMovie;
