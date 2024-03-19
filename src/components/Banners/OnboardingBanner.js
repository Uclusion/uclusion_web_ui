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
import Link from '@material-ui/core/Link';

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
          <Typography><b>Welcome to the inbox!</b> Clicking a For You row helps process incoming notifications with context.
          </Typography>
          <Typography>The From You tab tracks the input your team owes you.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('NOT_FULLY_VOTED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">job assistance</Link> flow.</Typography>
          <Typography>Help the team by voting.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_COMMENT') && (
        <div>
          <Typography><b>Enjoying the demo?</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">job assistance</Link> flow.</Typography>
          <Typography>This notifications self destructs when no longer needed.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('REPLY_MENTION') && (
        <div>
          <Typography><b>Enjoying the demo?</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">job assistance</Link> flow.</Typography>
          <Typography>Mentions go to just that person and cannot be dismissed.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNASSIGNED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#self-assigning-bugs" target="_blank">self assigning bugs</Link> flow.</Typography>
          <Typography>Take this bug to help.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('REVIEW_REQUIRED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#job-review" target="_blank">job review</Link> flow.</Typography>
          <Typography>Complete this review to help.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_ESTIMATE') && (
        <div>
          <Typography><b>Enjoying the demo?</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#job-estimation" target="_blank">job estimation</Link> flow.</Typography>
          <Typography>Updated guess at completion dates always available without meetings.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_REVIEWABLE') && (
        <div>
          <Typography><b>Enjoying the demo?</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#self-assigning-jobs" target="_blank">self assigning jobs</Link> flow.</Typography>
          <Typography>Take this assignment to help.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_JOB_APPROVAL_REQUEST') && (
        <div>
          <Typography><b>Enjoying the demo?</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">job approval</Link> flow.</Typography>
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