import React, { useContext } from 'react';
import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions';
import { useLocation } from 'react-router';
import DemoCreateWorkspaceButton from '../Buttons/DemoCreateWorkspaceButton';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { findMessagesForTypeObjectId } from '../../utils/messageUtils';
import { getMarket, marketIsDemo } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import Link from '@material-ui/core/Link';

const useStyles = makeStyles((theme) => {
  return {
    bannerBox: {
      '& button': {
        fontWeight: 'bold'
      },
      display: 'flex',
      justifyContent: 'space-around',
      [theme.breakpoints.down('sm')]: {
        marginTop: '0.1rem',
        display: 'unset'
      }
    },
  };
});

function OnboardingBanner() {
  const classes = useStyles();
  const [messagesState] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
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
          <Typography><b>Welcome to the inbox!</b> Click a row to process work with context.
          </Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('NOT_FULLY_VOTED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> - <Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">job assistance</Link> flow.</Typography>
          <Typography>Help the team by voting.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_COMMENT') && (
        <div>
          <Typography><b>Enjoying the demo?</b> - <Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">job assistance</Link> flow.</Typography>
          <Typography>Notifications go away if no longer needed.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('REPLY_MENTION') && (
        <div>
          <Typography><b>Enjoying the demo?</b> - <Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">job assistance</Link> flow.</Typography>
          <Typography>No dismiss button when you are mentioned.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNASSIGNED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> - <Link href="https://documentation.uclusion.com/flows/#self-assigning-bugs" target="_blank">self assigning bugs</Link> flow.</Typography>
          <Typography>Take this bug to help.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('REVIEW_REQUIRED') && (
        <div>
          <Typography><b>Enjoying the demo?</b> - <Link href="https://documentation.uclusion.com/flows/#job-review" target="_blank">job review</Link> flow.</Typography>
          <Typography>Complete this review to help.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_ESTIMATE') && (
        <div>
          <Typography><b>Enjoying the demo?</b> - <Link href="https://documentation.uclusion.com/flows/#job-estimation" target="_blank">job estimation</Link> flow.</Typography>
          <Typography>Updated estimates available without meetings.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_REVIEWABLE') && (
        <div>
          <Typography><b>Enjoying the demo?</b> - <Link href="https://documentation.uclusion.com/flows/#self-assigning-jobs" target="_blank">self assigning jobs</Link> flow.</Typography>
          <Typography>Take this assignment to help.</Typography>
        </div>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_JOB_APPROVAL_REQUEST') && (
        <div>
          <Typography><b>Enjoying the demo?</b> - <Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">job approval</Link> flow.</Typography>
          <Typography>Help decide what work should be done.</Typography>
        </div>
      )}
      {isInbox && typeObjectId && !typeObjectId.includes('_') && (
        <div>
          <Typography><b>Enjoying the demo?</b> Poke when no response.</Typography>
          <Typography>Here you socialize your assignment proposal.</Typography>
        </div>
      )}
      {!mobileLayout && (
        <div>
          <DemoCreateWorkspaceButton/>
        </div>
      )}
    </div>
  );
}

export default OnboardingBanner;