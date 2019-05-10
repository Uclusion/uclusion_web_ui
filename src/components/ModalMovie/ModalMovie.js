import React, {useState} from 'react';
import PropTypes from 'prop-types';
import { Modal, Card, Button } from '@material-ui/core';
import MoviePlayer from './MoviePlayer';

function ModalMovie(props){

  const { url, onClose, autoPlay, open } = props;
  const [amOpen, setAmOpen] = useState(open);

  function myOnClose(){
    setAmOpen(false);
    onClose();
  }

  return (
    <Modal open={amOpen}>
      <Card>
      <MoviePlayer autoPlay={autoPlay} url={url} />
      <Button onClick={myOnClose}>Close</Button>
      </Card>
    </Modal>
  );

}

ModalMovie.propTypes = {
  url: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  autoPlay: PropTypes.bool.isRequired,
  open: PropTypes.bool.isRequired,
};


export default ModalMovie;
