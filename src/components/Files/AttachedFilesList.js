import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Link } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { FormattedMessage, useIntl } from 'react-intl';
import config from '../../config';
import LoadingOverlay from 'react-loading-overlay';
import { makeStyles } from '@material-ui/styles';
import FileUploader from './FileUploader';
import { getMarketLogin } from '../../api/marketLogin';
import SpinningTooltipIconButton from '../SpinBlocking/SpinningTooltipIconButton';

const useStyles = makeStyles((theme) => ({
  sectionTitle: {
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  file: {
    wordBreak: 'break-all'
  },
  sidebarContent: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: 0,
    '& span': {
      padding: 0,
      fontSize: '.9375rem',
      fontWeight: 700
    }
  },
  capitalize: {
    textTransform: 'capitalize'
  }
}))

function AttachedFilesList(props) {

  const { marketId, attachedFiles, onUpload, onDeleteClick } = props;
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const classes = useStyles();
  const intl = useIntl();
  const fileBaseUrl = config.file_download_configuration.baseURL;

  /** Since the service worker doesn't want to fire for external links,
   * we'll do it's job for it and click the new url
   * @param link
   * @param originalName
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
    return (filesList || []).map((file, index) => {
      const {original_name, path} = file;
      const linkToFile = `${fileBaseUrl}/${path}`;
      return (
      <div style={{width: '40%'}}>
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
            <SpinningTooltipIconButton
              id='deleteFiles'
              translationId="delete"
              edge="end"
              onClick={() => onDeleteClick(path)}
              icon={<DeleteIcon htmlColor="black" />}
              aria-label="delete"
            />
        </div>
      )
    })
  }

  const hasFiles = !_.isEmpty(attachedFiles);

  return (
    <LoadingOverlay
      active={uploadInProgress}
      spinner
      text={intl.formatMessage({ id: 'uploadInProgress' })}
    >
      <div className={classes.sectionTitle}>
        <FormattedMessage id="attachedFilesSection"/>
      </div>
      {!hasFiles && (
        <FileUploader marketId={marketId} onUpload={onUpload} setUploadInProgress={setUploadInProgress} />
      )}
      {hasFiles && (
      <div>
        <FileUploader key="uploader" marketId={marketId} onUpload={onUpload}
                      setUploadInProgress={setUploadInProgress}/>
        {displayLinksList(attachedFiles)}
      </div>
      )}
    </LoadingOverlay>
  );
}

AttachedFilesList.propTypes = {
  onUpload: PropTypes.func,
  attachedFiles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  onDeleteClick: PropTypes.func,
  isAdmin: PropTypes.bool,
};

AttachedFilesList.defaultProps = {
  attachedFiles: [],
  onUpload: () => {},
  isAdmin: false,
  onDeleteClick: () => {},
};

export default AttachedFilesList;