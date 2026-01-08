import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Dialog } from '../../Dialogs';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Typography } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';

function VideoDialog (props) {
  const {
    open = false,
    onSave = () => {},
    onClose = () => {}
  } = props;

  const [videoUrl, setVideoUrl] = useState("");
  const autoFocusRef = useRef(null);
  const intl = useIntl();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      autoFocusRef={autoFocusRef}
      content={(
        <div>
          <Typography>
            {intl.formatMessage({id: 'VideoDialogExplanation'})}
          </Typography>
          <TextField
            ref={autoFocusRef}
            fullWidth
            autoFocus
            label={intl.formatMessage({ id: "VideoDialogUrl" })}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder={intl.formatMessage({
              id: "VideoDialogUrlPlaceholder"
            })}
            value={videoUrl}
            variant="filled"
          />
        </div>
      )}
      title={<FormattedMessage id="VideoDialogTitle"/>}
      actions={
        <React.Fragment>
          <Button
            disableFocusRipple
            onClick={() => {
              setVideoUrl("");
              onClose();
            }}
          >
            <FormattedMessage id="cancel"/>
          </Button>
          <Button
            disabled={_.isEmpty(videoUrl)}
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

export default VideoDialog;