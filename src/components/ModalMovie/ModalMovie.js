import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Card, Button } from '@material-ui/core';
import MoviePlayer from './MoviePlayer';

function ModalMovie(props) {
  const {
    url, onClose, autoPlay, open,
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
    <Modal open={amOpen}>
      <Card>
        <MoviePlayer autoPlay={autoPlay} url={url} onFinish={myOnClose} />
        <Button onClick={myOnClose}>Close</Button>
      </Card>
    </Modal>
  );
}

ModalMovie.propTypes = {
  url: PropTypes.string.isRequired,
  // eslint-disable-next-line react/require-default-props
  onClose: PropTypes.func,
  autoPlay: PropTypes.bool.isRequired,
  open: PropTypes.bool.isRequired,
};


export default ModalMovie;
