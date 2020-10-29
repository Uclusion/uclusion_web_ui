import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import isUrl from 'is-url';
import { Dialog } from '../../Dialogs';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Typography } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';

function VideoDialog (props) {
  const {
    open,
    onSave,
    onClose
  } = props;

  const [videoUrl, setVideoUrl] = useState("");
  const autoFocusRef = useRef(null);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      autoFocusRef={autoFocusRef}
      content={<VideoLinkForm videoUrl={videoUrl} setVideoUrl={setVideoUrl}/>}
      actions={
        <React.Fragment>
          <Button
            disableFocusRipple
            onClick={onClose}
            ref={autoFocusRef}
          >
            <FormattedMessage id="cancel"/>
          </Button>
          <Button
            disabled={!isUrl(videoUrl)}
            onClick={() => {
              onSave(videoUrl);
              setVideoUrl("");
              onClose();
            }}
          >
            <FormattedMessage id="VideoDialogTitleAddButton"/>
          </Button>
        </React.Fragment>
      }
    />

  );
}

VideoDialog.propTypes = {
  onSave: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};

VideoDialog.defaultProps = {
  open: false,
  onSave: () => {},
  onClose: () => {},
}

function VideoLinkForm (props) {

  const {
    videoUrl,
    setVideoUrl
  } = props;

  const onUrlChange = (event) => {
    setVideoUrl(event.target.value);
  }

  const intl = useIntl();
  return (
    <div>
      <Typography>
        {intl.formatMessage({id: 'VideoDialogExplanation'})}
      </Typography>
      <TextField
        fullWidth
        label={intl.formatMessage({ id: "VideoDialogUrl" })}
        onChange={onUrlChange}
        placeholder={intl.formatMessage({
          id: "VideoDialogUrlPlaceholder"
        })}
        value={videoUrl}
        variant="filled"
      />
    </div>
  )

}

export default VideoDialog;