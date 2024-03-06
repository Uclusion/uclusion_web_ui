import React from 'react';
import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { wizardStyles } from '../InboxWizards/WizardStylesContext';
import { decomposeMarketPath, navigate } from '../../utils/marketIdPathFunctions';
import { WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { useHistory, useLocation } from 'react-router';
const useStyles = makeStyles(() => {
  return {
    bannerBox: {
      height: '70px',
      '& button': {
        fontWeight: 'bold'
      },
      display: 'flex',
      justifyContent: 'space-around'
    },
  };
});

function OnboardingBanner() {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const wizardClasses = wizardStyles();
  const { pathname } = location;
  const { marketId: typeObjectIdRaw, action } = decomposeMarketPath(pathname);
  const isInbox = action === 'inbox';
  const typeObjectId = isInbox ? typeObjectIdRaw : undefined;

  return (
    <div className={classes.bannerBox}>
      {((isInbox && typeObjectId === undefined) || !isInbox) && (
        <div>
          <Typography><b>Welcome to the demo!</b> Click around to see this team using a workspace instead of meetings.
          </Typography>
          <Typography>The inbox is across all groups and workspaces.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('NOT_FULLY_VOTED') && (
        <div>
          <Typography><b>Enjoying the demo?</b></Typography>
          <Typography>Asynchronous avoids on the fly pressure to decide.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_COMMENT') && (
        <div>
          <Typography><b>Enjoying the demo?</b></Typography>
          <Typography>This notifications self destructs when no longer needed.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('REPLY_MENTION') && (
        <div>
          <Typography><b>Enjoying the demo?</b></Typography>
          <Typography>Mentions go to just that person and cannot be dismissed.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNASSIGNED') && (
        <div>
          <Typography><b>Enjoying the demo?</b></Typography>
          <Typography>Triage gets important bugs looked at quickly.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('REVIEW_REQUIRED') && (
        <div>
          <Typography><b>Enjoying the demo?</b></Typography>
          <Typography>Reviews can be before you write code or after a UI is up.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_ESTIMATE') && (
        <div>
          <Typography><b>Enjoying the demo?</b></Typography>
          <Typography>Updated guess at completion dates always available without meetings.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_REVIEWABLE') && (
        <div>
          <Typography><b>Enjoying the demo?</b></Typography>
          <Typography>Jobs are self assigned without meetings.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_JOB_APPROVAL_REQUEST') && (
        <div>
          <Typography><b>Enjoying the demo?</b></Typography>
          <Typography>What work should be done next is an asynchronous group decision.</Typography>
        </div>
      )}
      {isInbox && typeObjectId && !typeObjectId.includes('_') && (
        <div>
          <Typography><b>Enjoying the demo?</b> Poke if you don't get a response.</Typography>
          <Typography>Here you can see progress on socializing your assignment proposal.</Typography>
        </div>
      )}
      <div>
        <Button
          onClick={() => {
            navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
          }}
          className={wizardClasses.actionNext}
          id="workspaceFromDemoBanner"
          >
            Create your workspace
          </Button>
        </div>
    </div>
  );
}


export default OnboardingBanner;