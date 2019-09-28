import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core';
import { fetchFileFromS3 } from '../../../api/files';

const useStyles = makeStyles(theme => ({
  image: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '20em',
    boxShadow: 'none',
  },
}));

function LoadableImage(props) {
  const classes = useStyles();
  const [src, setSrc] = useState('');

  const { metadata } = props;
  const path = metadata ? metadata.path : '';
  const uclusion_token = metadata ? metadata.uclusion_token : '';

  console.log(props);

  useEffect(() => {
    if (!src && metadata) {
      fetchFileFromS3(metadata)
        .then((data) => {
          setSrc(URL.createObjectURL(data));
        });
    }
  });

  return (
    <img className={classes.image}
         src={src}
         path={path}
         uclusion_token={uclusion_token}
    />
  );
}

export default LoadableImage;
