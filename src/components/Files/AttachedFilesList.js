import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, List, Paper, Typography } from '@material-ui/core';
import { FormattedMessage, useIntl } from 'react-intl';
import clsx from 'clsx';
import config from '../../config';
import LoadingOverlay from 'react-loading-overlay'

import { makeStyles } from '@material-ui/styles';
import FileUploader from './FileUploader';
import { useMetaDataStyles } from '../../pages/Investible/Planning/PlanningInvestible';
import { getMarketLogin } from '../../api/uclusionClient';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px',
    marginTop: '-6px',
    boxShadow: 'none',
    width: '100%',
  },

  file: {
    padding: '10px'
  },
  sidebarContent: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingTop: '0',
    paddingBottom: '0',
    '& span': {
      fontSize: '.9375rem',
      fontWeight: 700
    }
  },
  capitalize: {
    textTransform: 'capitalize'
  }
}))

function AttachedFilesList(props) {

  const { marketId, attachedFiles, onUpload } = props;
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const metaClasses = useMetaDataStyles();
  const classes = useStyles();
  const intl = useIntl();

  const fileBaseUrl = config.file_download_configuration.baseURL;

  /** Since the service worker doesn't want to fire for external links,
   * we'll do it's job for it and click the new url
   * @param link
   * @returns {*}
   */
  function downloadFile(link, originalName) {
    return getMarketLogin(marketId)
      .then((results) => {
        const { uclusion_token } = results;
        const newUrl = `${link}?authorization=${uclusion_token}`;
        const linkEl = document.createElement('a')
        linkEl.href = newUrl;
        linkEl.target = '_';
        linkEl.download = originalName;
        linkEl.click();
      });
  }

  function displayLinksList (filesList) {
    return filesList.map((file, index) => {
      const {original_name, path} = file;
      const linkToFile = `${fileBaseUrl}/${path}`;
      return (
        <ul key={path}>
            <Typography key={index} component="li">
              <Link
                href={linkToFile}
                variant="inherit"
                underline="always"
                color="primary"
                download={original_name}
                onClick={(e) => {
                  e.preventDefault();
                  downloadFile(linkToFile, original_name);
                }}
                className={classes.file}
              >
                {original_name}
              </Link>
            </Typography>
        </ul>
      )
    })
  }

  return (
    <Paper className={classes.container} id="summary">
      <div className={classes.capitalize}>
        <FormattedMessage id="attachedFilesSection"/>
        <div
          className={clsx(metaClasses.group, metaClasses.assignments, metaClasses.linkContainer, metaClasses.scrollContainer)}>
          <LoadingOverlay
            active={uploadInProgress}
            spinner
            text={intl.formatMessage({ id: 'uploadInProgress' })}
          >
            <List className={classes.sidebarContent}>
              <FileUploader marketId={marketId} onUpload={onUpload} setUploadInProgress={setUploadInProgress}/>
            </List>
            {displayLinksList(attachedFiles)}
          </LoadingOverlay>
        </div>
      </div>
    </Paper>
  );
}

AttachedFilesList.propTypes = {
  onUpload: PropTypes.func,
  attachedFiles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
};

AttachedFilesList.defaultProps = {
  attachedFiles: [],
  onUpload: () => {}
};

export default AttachedFilesList;