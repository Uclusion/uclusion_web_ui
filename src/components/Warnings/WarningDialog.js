import React from 'react';
import { Dialog } from '../Dialogs';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Clear } from '@material-ui/icons'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import WarningIcon from '@material-ui/icons/Warning'

function WarningDialog(props) {
  const { actions, classes, open, onClose, issueWarningId } = props;
  const intl = useIntl();
  const autoFocusRef = React.useRef(null);

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
          <SpinningIconLabelButton onClick={onClose} doSpin={false} icon={Clear} ref={autoFocusRef}>
            {intl.formatMessage({ id: 'lockDialogCancel' })}
          </SpinningIconLabelButton>
          {actions}
        </React.Fragment>
      }
      content={<FormattedMessage id={issueWarningId} />}
      title={
        <React.Fragment>
          <WarningIcon className={classes.warningTitleIcon} />
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