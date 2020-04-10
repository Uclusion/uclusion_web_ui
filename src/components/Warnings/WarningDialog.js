import React from 'react';
import { Dialog } from '../Dialogs';
import { Button } from '@material-ui/core';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

function WarningDialog(props) {
  const { actions, classes, open, onClose, issueWarningId, icon } = props;

  const autoFocusRef = React.useRef(null);
  const WarningIcon = React.cloneElement(icon, { className: classes.warningTitleIcon} );

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.issueWarningContent,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <React.Fragment>
          {actions}
          <Button
            className={clsx(classes.action, classes.actionCancel)}
            disableFocusRipple
            onClick={onClose}
            ref={autoFocusRef}
          >
            <FormattedMessage id="lockDialogCancel" />
          </Button>
        </React.Fragment>
      }
      content={<FormattedMessage id={issueWarningId} />}
      title={
        <React.Fragment>
          {WarningIcon}
          <FormattedMessage id="warning" />
        </React.Fragment>
      }
    />
  );
}

WarningDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  issueWarningId: PropTypes.string.isRequired,
};

export default WarningDialog;