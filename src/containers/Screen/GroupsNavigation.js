import { FormattedMessage } from 'react-intl'
import PropTypes from 'prop-types'
import React from 'react'
import { Button } from '@material-ui/core'
import { Dialog } from '../../components/Dialogs'
import { useLockedDialogStyles } from '../../pages/Dialog/DialogBodyEdit'
import AddNewUsers from '../../pages/Dialog/UserManagement/AddNewUsers'

function GroupsNavigation(props) {
  const { defaultMarket, open, setOpen } = props;
  const lockedDialogClasses = useLockedDialogStyles();
  const autoFocusRef = React.useRef(null);

  let actions = <div />;
  if (open === 'addNewUsers') {
    actions = <Button
      variant="outlined"
      size="small"
      id='closeAddNewUsers'
      onClick={() => setOpen(false)}
      ref={autoFocusRef}
    >
      <FormattedMessage id="close" />
    </Button>;
  }
  let content = <div />;
  if (open === 'addNewUsers') {
    content = <AddNewUsers market={defaultMarket} />;
  }

  return (
      <Dialog
        autoFocusRef={autoFocusRef}
        classes={{
          root: lockedDialogClasses.root,
          actions: lockedDialogClasses.actions,
          content: lockedDialogClasses.issueWarningContent,
          title: lockedDialogClasses.title
        }}
        open={open !== false}
        onClose={() => setOpen(false)}
        disableActionClass={open === 'addNewUsers'}
        actions={actions}
        content={content}
      />
  );
}

GroupsNavigation.propTypes = {
  defaultMarket: PropTypes.object
}

export default GroupsNavigation;