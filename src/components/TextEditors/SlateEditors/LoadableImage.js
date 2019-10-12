import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core';
import { fetchFileFromS3 } from '../../../api/files';
import { useIntl } from 'react-intl';

const useStyles = makeStyles(theme => ({
  image: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '20em',
    boxShadow: 'none',
  },
  selectedImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '20em',
    boxShadow: '0 0 0 2px blue;',
  },
}));

function LoadableImage(props) {
  const classes = useStyles();
  const intl = useIntl();
  const { metadata, selected } = props;
  const [imageData, setImageData] = useState({});

  const { src, loadFailed } = imageData;


  useEffect(() => {
    if (!loadFailed && !src) {
      fetchFileFromS3(metadata)
        .then((response) => {
          const { blob } = response;
          const src = URL.createObjectURL(blob);
          const newImageData = { src, loadFailed: false };
          setImageData(newImageData);
        })
        .catch(() => {
          const newImageData = { src: undefined, loadFailed: true };
          setImageData(newImageData);
        });
    }
  });

  const alt = intl.formatMessage({ id: 'loadableImageAlt' });
  const className = selected ? classes.selectedImage : classes.image;
  return (
    <img className={className} src={src} alt={alt} />
  );
}

export default LoadableImage;
