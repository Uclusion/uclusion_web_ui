import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core';
import { fetchFileFromS3 } from '../../../api/files';
import { useIntl } from 'react-intl';
import useBlobUrlCache from '../../../localData/useBlobUrlCache';

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
  const { path } = metadata;
  const [imageData, setImageData] = useState({});
  const { addBlobUrlToCache, getBlobUrl } = useBlobUrlCache();
  const { src, loadFailed } = imageData;

  function setImageDataUrl(url) {
    const src = url;
    const newImageData = { src, loadFailed: false };
    setImageData(newImageData);
  }


  useEffect(() => {
    if (!loadFailed && !src) {
      getBlobUrl(path)
        .then((url) => {
          return setImageDataUrl(url);
        })
        .catch(() => {
          return fetchFileFromS3(metadata)
            .then((response) => {
              console.debug(`Fetching ${path} from S3`);
              const { blob } = response;
              const url = URL.createObjectURL(blob);
              console.debug(`Blob Url ${url}`);
              return addBlobUrlToCache(path, url)
                .then((url) => {
                  console.debug(`Added url ${url} to cache`);
                  return setImageDataUrl(url);
                });
            })
            .catch(() => {
              const newImageData = { src: undefined, loadFailed: true };
              setImageData(newImageData);
            });
        });
    }
  });
  console.debug(src);
  const alt = intl.formatMessage({ id: 'loadableImageAlt' });
  const className = selected ? classes.selectedImage : classes.image;
  return (
    <img className={className} src={src} alt={alt} />
  );
}

export default LoadableImage;
