import React from 'react'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import ShareIcon from '@material-ui/icons/Share'
import { Button } from '@material-ui/core'
import { Dialog } from '../../../components/Dialogs'
import clsx from 'clsx'
import { FormattedMessage } from 'react-intl'
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit'
import InviteLinker from '../../Dialog/InviteLinker'

function ShareStoryButton(props) {
  const { commentId, investibleId, marketId } = props;
  const hashPart = commentId ? `#c${commentId}` : undefined;
  const paramsPart = commentId ? `?subscribeId=${commentId}` : investibleId ? `?subscribeId=${investibleId}`
    : `?subscribeId=${marketId}`;
  const autoFocusRef = React.useRef(null);
  const lockedDialogClasses = useLockedDialogStyles();
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => {
    setOpen(true);
  };

  if (window.location.href.includes('inbox') || window.location.href.includes('outbox')) {
    return React.Fragment;
  }

  return (
    <>
      <TooltipIconButton icon={<ShareIcon/>} onClick={handleOpen}
                         translationId="shareButtonExplanation" />
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
          marketToken={hashPart ? `${window.location.href}${paramsPart}${hashPart}` :
            paramsPart ? `${window.location.href}${paramsPart}` : window.location.href}
          investibleId={investibleId}
          marketId={marketId}
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
