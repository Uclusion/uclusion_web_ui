import React from 'react'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import ShareIcon from '@material-ui/icons/Share'
import { Button, ListItemText } from '@material-ui/core'
import { Dialog } from '../../../components/Dialogs'
import clsx from 'clsx'
import { FormattedMessage, useIntl } from 'react-intl'
import { makeStyles } from '@material-ui/styles'
import { useLockedDialogStyles } from '../../Dialog/DialogEdit'
import InviteLinker from '../../Dialog/InviteLinker'

export const useStyles = makeStyles(() => {
  return {
    root: {
      alignItems: "flex-start",
      display: "flex"
    },
    menuItem: {
      paddingLeft: 0,
      marginRight: 0,
      paddingBottom: '10px',
    },
    menuIcon: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      display: 'flex',
      justifyContent: 'center',
      color: 'black',
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '30px',
      },
    },
    menuTitle: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      color: 'black',
      fontWeight: 'bold',
    },
  };
});

function ShareStoryButton(props) {
  const classes = useStyles();
  const intl = useIntl();
  const autoFocusRef = React.useRef(null);
  const lockedDialogClasses = useLockedDialogStyles();
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <>
      <TooltipIconButton icon={<ShareIcon/>} onClick={handleOpen}
                         translationId="shareButtonExplanation" >
        <ListItemText className={classes.menuTitle}>
          {intl.formatMessage({ id: 'shareButtonTitle' })}
        </ListItemText>
      </TooltipIconButton>
      <br />
      <Dialog
        autoFocusRef={autoFocusRef}
        classes={{
          root: lockedDialogClasses.root,
          actions: lockedDialogClasses.actions,
          content: lockedDialogClasses.issueWarningContent,
          title: lockedDialogClasses.title
        }}
        open={open}
        onClose={() => setOpen(false)}
        /* slots */
        actions={
          <Button
            className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionCancel)}
            disableFocusRipple
            onClick={() => setOpen(false)}
            ref={autoFocusRef}
          >
            <FormattedMessage id="close" />
          </Button>
        }
        content={<InviteLinker
          marketType="story"
          marketToken={window.location.href}
        />}
        title={
          <React.Fragment>
            <FormattedMessage id="shareButtonTitle" />
          </React.Fragment>
        }
      />
    </>
  );
}

export default ShareStoryButton;
