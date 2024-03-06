import React, { useContext } from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions';
import { useLocation } from 'react-router';
import DemoCreateWorkspaceButton from '../Buttons/DemoCreateWorkspaceButton';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { findMessagesForTypeObjectId } from '../../utils/messageUtils';
import { getMarket, marketIsDemo } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';

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
  const [messagesState] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const location = useLocation();
  const { pathname } = location;
  const { marketId: typeObjectIdRaw, action } = decomposeMarketPath(pathname);
  const isInbox = action === 'inbox';
  const typeObjectId = isInbox ? typeObjectIdRaw : undefined;
  const message = findMessagesForTypeObjectId(typeObjectId, messagesState);
  const market = getMarket(marketsState, message?.market_id);

  if (message && !marketIsDemo(market)) {
    return React.Fragment;
  }

  return (
    <div className={classes.bannerBox}>
      {((isInbox && typeObjectId === undefined) || !isInbox) && (
        <div>
          <Typography><b>Welcome to the demo!</b> This team uses a workspace instead of meetings. Click a notification to help.
          </Typography>
          <Typography>The inbox is across all groups and workspaces.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('NOT_FULLY_VOTED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> Help the team by voting.</Typography>
          <Typography>Asynchronous avoids on the fly pressure to decide.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_COMMENT') && (
        <div>
          <Typography><b>Enjoying the demo?</b> Process this notification to help.</Typography>
          <Typography>This notifications self destructs when no longer needed.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('REPLY_MENTION') && (
        <div>
          <Typography><b>Enjoying the demo?</b> Your help was requested here.</Typography>
          <Typography>Mentions go to just that person and cannot be dismissed.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNASSIGNED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> Take this assignment to help.</Typography>
          <Typography>Triage gets important bugs looked at quickly.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('REVIEW_REQUIRED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> Complete this review to help.</Typography>
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
          <Typography><b>Enjoying the demo?</b> Take this assignment to help.</Typography>
          <Typography>Jobs are self assigned without meetings.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_JOB_APPROVAL_REQUEST') && (
        <div>
          <Typography><b>Enjoying the demo?</b> Approve this assignment to help.</Typography>
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
        <DemoCreateWorkspaceButton />
      </div>
    </div>
  );
}


export default OnboardingBanner;