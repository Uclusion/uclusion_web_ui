import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Dialog } from '../../Dialogs';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Typography } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';

function LinkDialog (props) {
  const {
    open,
    onSave,
    onClose,
  } = props;

  const [linkUrl, setLinkUrl] = useState("");
  const autoFocusRef = useRef(null);
  const intl = useIntl();

  function resetForm() {
    setLinkUrl("");
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      autoFocusRef={autoFocusRef}
      content={(
        <div>
          <Typography>
            {intl.formatMessage({id: 'LinkDialogExplanation'})}
          </Typography>
          <TextField
            ref={autoFocusRef}
            autoFocus
            fullWidth
            label={intl.formatMessage({ id: "LinkDialogUrl" })}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder={intl.formatMessage({
              id: "LinkDialogUrlPlaceHolder"
            })}
            value={linkUrl}
            variant="filled"
          />
        </div>
      )}
      title={<FormattedMessage id="LinkDialogTitle"/>}
      actions={
        <React.Fragment>
          <Button
            disableFocusRipple
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            <FormattedMessage id="cancel"/>
          </Button>
          <Button
            disabled={_.isEmpty(linkUrl)}
            onClick={() => {
              onSave(linkUrl);
              resetForm();
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

LinkDialog.propTypes = {
  onSave: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};

LinkDialog.defaultProps = {
  open: false,
  onSave: () => {},
  onClose: () => {},
}


export default LinkDialog;