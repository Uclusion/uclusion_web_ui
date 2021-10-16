import React from 'react'
import { Dialog } from '../Dialogs'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { Clear } from '@material-ui/icons'
import { FormattedMessage } from 'react-intl'
import DismissableText from '../Notifications/DismissableText'
import WarningIcon from '@material-ui/icons/Warning'
import PropTypes from 'prop-types'

function IssueDialog(props) {
  const { actions, classes, open, onClose, issueWarningId, checkBoxFunc, showDismiss } = props

  const autoFocusRef = React.useRef(null)

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
            <FormattedMessage id="lockDialogCancel"/>
          </SpinningIconLabelButton>
          {actions}
          {showDismiss && (
            <DismissableText textId={issueWarningId} checkBoxFunc={checkBoxFunc}/>
          )}
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

IssueDialog.propTypes = {
  actions: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  issueWarningId: PropTypes.string.isRequired,
};

export default IssueDialog;