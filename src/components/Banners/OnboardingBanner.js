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
      marginLeft: '10rem',
      marginTop: '0.5rem',
      [theme.breakpoints.down('sm')]: {
        marginLeft: 'unset',
        marginBottom: '1rem'
      }
    },
    bannerBoxStuff: {
      '& button': {
        fontWeight: 'bold',
        marginLeft: '5rem'
      },
      display: 'flex',
      marginBottom: '0.3rem',
      [theme.breakpoints.down('sm')]: {
        marginTop: '0.3rem',
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
    if (market?.market_sub_type === 'SUPPORT' && typeObjectId?.startsWith('UNREAD_COMMENT')) {
      return (
        <div className={classes.bannerBox}>
          <div className={classes.bannerBoxStuff}>
            <Typography>
              <b>Welcome to support!</b> Going to this message put you in the support workspace.
            </Typography>
          </div>
        </div>
      );
    }
    return React.Fragment;
  }

  return (
    <div className={classes.bannerBox}>
      <div className={classes.bannerBoxStuff}>
      {((isInbox && typeObjectId === undefined) || !isInbox) && (
          <Typography><b>Welcome to the inbox!</b> Click a row to process work with context.
          </Typography>
      )}
      {isInbox && typeObjectId?.startsWith('NOT_FULLY_VOTED') && (
          <Typography><Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">Job assistance</Link>.
            Help the demo team by voting.</Typography>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_COMMENT') && (
          <Typography><Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">Job assistance</Link>.
            Goes away if not needed.</Typography>
      )}
      {isInbox && typeObjectId?.startsWith('REPLY_MENTION') && (
        <>
          <Typography style={{marginRight: '0.2rem'}}><Link href="https://documentation.uclusion.com/flows/#job-assistance" target="_blank">Job assistance</Link>.</Typography>
          <Typography>You are mentioned so can't dismiss.</Typography>
        </>
      )}
      {isInbox && (typeObjectId?.startsWith('UNASSIGNED')||typeObjectId.startsWith('UNREAD_REVIEWABLE')) && (
          <Typography><Link href="https://documentation.uclusion.com/flows/#self-assigning-bugs" target="_blank">Self assigning bugs</Link>.
            Take this bug to help.</Typography>
      )}
      {isInbox && typeObjectId?.startsWith('REVIEW_REQUIRED') && (
          <Typography><Link href="https://documentation.uclusion.com/flows/#job-review" target="_blank">Job review</Link>.
            Complete this review to help.</Typography>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_ESTIMATE') && (
          <Typography><Link href="https://documentation.uclusion.com/flows/#job-estimation" target="_blank">Job estimation</Link>.
            Updated estimates available without meetings.</Typography>
      )}
      {isInbox && typeObjectId?.startsWith('UNREAD_JOB_APPROVAL_REQUEST') && (
          <Typography><Link href="https://documentation.uclusion.com/flows/#job-approval" target="_blank">Job approval</Link>.
            Help decide what work is done.</Typography>
      )}
      {isInbox && typeObjectId && !typeObjectId.includes('_') && (
          <Typography><Link href="https://documentation.uclusion.com/flows/#job-approval" target="_blank">Job approval</Link> for your assignment. Poke if no response.</Typography>
      )}
      {!mobileLayout && !typeObjectId?.startsWith('UNREAD_GROUP') && (
        <DemoCreateWorkspaceButton/>
      )}
      </div>
    </div>
  );
}

export default OnboardingBanner;