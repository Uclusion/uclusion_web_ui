import WorkListItem from './WorkListItem'
import { Fab, Menu, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import React, { useContext, useState } from 'react'
import styled from "styled-components";
import { useIntl } from 'react-intl'
import { Link } from '@material-ui/core'
import { MoveToInbox } from '@material-ui/icons'
import WarningIcon from '@material-ui/icons/Warning'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import HourglassFullIcon from '@material-ui/icons/HourglassFull'
import NotesIcon from '@material-ui/icons/Notes'
import { createTitle, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { PLANNING_TYPE } from '../../../constants/markets'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import _ from 'lodash'
import Badge from '@material-ui/core/Badge'
import { makeStyles } from '@material-ui/styles'

const SectionTitle = styled("div")`
  width: auto;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

function getPriorityIcon(level) {
  switch (level) {
    case 'RED':
      return <WarningIcon style={{fontSize: 24, color: '#E85757',}}/>;
    case 'YELLOW':
      return <HourglassFullIcon style={{fontSize: 24, color: '#e6e969',}}/>;
    case 'BLUE':
      return <NotesIcon style={{fontSize: 24, color: '#2D9CDB',}}/>;
    default:
      return undefined;
  }
}

function convertStageName(name, intl) {
  switch (name) {
    case 'In Dialog':
      return intl.formatMessage({ id: 'planningInvestibleToVotingLabel' });
    case 'In Review':
      return intl.formatMessage({ id: 'planningInvestibleNextStageInReviewLabel' });
    case 'Accepted':
      return intl.formatMessage({ id: 'planningAcceptedStageLabel' });
    case 'Blocked':
      return intl.formatMessage({ id: 'planningBlockedStageLabel' });
    case 'Requires Input':
      return intl.formatMessage({ id: 'requiresInputStageLabel' });
    case 'Further Work':
      return intl.formatMessage({ id: 'readyFurtherWorkHeader' });
    default:
      return name;
  }
}

function getTitle(marketType, linkType, name, marketId, investibleId, investibleState, marketStagesState, intl) {
  if (linkType === 'INVESTIBLE' && marketType === PLANNING_TYPE) {
    const inv = getInvestible(investibleState, investibleId) || {};
    const { market_infos } = inv;
    const [info] = (market_infos || []);
    const { stage: currentStageId } = (info || {});
    const stage = getFullStage(marketStagesState, marketId, currentStageId) || {};
    return convertStageName(stage.name, intl);
  }
  return name;
}

const useStyles = makeStyles(
  theme => {
    return {
      chip: {
        color: 'black',
        '& .MuiBadge-badge': {
          border: '0.5px solid grey',
          backgroundColor: '#fff',
        },
      },
      fab: {
        backgroundColor: '#fff',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        minHeight: '48px',
        [theme.breakpoints.down('sm')]: {
          width: '36px',
          height: '36px',
          minHeight: '36px'
        },
      },
      bellButton: {
        marginLeft: '0.5em',
        marginRight: '0.5em',
        marginTop: '0.5rem'
      }
    };
});

function Inbox(props) {
  const { isSectionOpen, isJarDisplay = false } = props;
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const intl = useIntl();
  const history = useHistory();
  const [anchorEl, setAnchorEl] = useState(null);
  const [messagesState] = useContext(NotificationsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState] = useContext(CommentsContext);
  const { messages: messagesUnsafe } = messagesState;
  let messages;
  let unreadCount = 0;
  if (isJarDisplay) {
    messages = (messagesUnsafe || []).filter((message) => message.type !== 'UNREAD_REPORT' && message.is_highlighted);
    unreadCount = messages.length;
  }
  if (_.isEmpty(messages)) {
    messages = (messagesUnsafe || []).filter((message) => message.type !== 'UNREAD_REPORT');
  }

  let messagesOrdered;
  if (isJarDisplay) {
    messagesOrdered = _.orderBy(messages, [(message) => {
      const { level } = message;
      switch (level) {
        case 'RED':
          return 2;
        case 'YELLOW':
          return 1;
        default:
          return 0;
      }}, (message) => message.updated_at], ['desc', 'desc'] ) || [];
  } else {
    messagesOrdered =  _.orderBy(messages, ['updated_at'], ['desc']) || [];
  }

  const rows = messagesOrdered.map((message, i) => {
    const { level, market_name: market, investible_name: investible, updated_at: updatedAt, investible_id: investibleId,
      is_highlighted: isHighlighted, name, text, link, type_object_id: typeObjectId, market_id: marketId,
      comment_id: commentId, market_type: marketType, link_type: linkType } = message;
    const title = getTitle(marketType, linkType, name, marketId, investibleId, investibleState, marketStagesState,
      intl);
    const titleSize = mobileLayout ? 25 : (!investible && !commentId ? 100 : 50);
    const item = {
      title,
      description: text,
      priorityIcon: getPriorityIcon(level),
      market: createTitle(market, titleSize),
      investible: createTitle(investible, titleSize),
      read: !isHighlighted,
      isDeletable: typeObjectId.startsWith('UNREAD'),
      date: intl.formatDate(updatedAt),
      message
    }
    if (commentId) {
      const rootComment = getCommentRoot(commentState, marketId, commentId);
      if (rootComment) {
        const comment = nameFromDescription(rootComment.body);
        if (comment) {
          item.comment = comment;
        }
      }
    }
    return <Link href={link} style={{ width: '100%' }} onClick={
      (event) => {
        preventDefaultAndProp(event);
        navigate(history, link);
      }
    }><WorkListItem key={i} isJarDisplay={isJarDisplay} {...item} /></Link>;
  })

  if (isJarDisplay) {
    if (_.isEmpty(messages)) {
      return React.Fragment;
    }
    const first = messagesOrdered[0];
    return (
      <>
        <div id='inboxNotification' key='inbox'
             onClick={(event) => setAnchorEl(event.currentTarget)}
             className={classes.bellButton}>
          <Badge badgeContent={unreadCount} className={classes.chip} overlap="circle">
            <Fab id='notifications-fabInbox' className={classes.fab}>
              <MoveToInbox
                htmlColor={ first.level === 'RED' ? '#E85757' : (first.level === 'YELLOW' ? '#e6e969' : '#2D9CDB')} />
            </Fab>
          </Badge>
        </div>
        <Menu
          id="profile-menu"
          open={anchorEl !== null}
          onClose={() => setAnchorEl(null)}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          anchorEl={anchorEl}
          disableRestoreFocus
        >
          { rows }
        </Menu>
      </>
    );
  }

  return (
    <div id="inbox" style={{ display: isSectionOpen('inbox') ? 'block' : 'none',
      paddingBottom: '3rem' }}>
      <SectionTitle>
        {<MoveToInbox htmlColor="#333333"/>}
        <Typography style={{marginLeft: '1rem'}} variant="h6">
          {intl.formatMessage({ id: 'inbox' })}
        </Typography>
      </SectionTitle>
      { rows }
    </div>
  );
}

export default Inbox;