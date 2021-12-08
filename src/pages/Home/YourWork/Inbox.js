import WorkListItem, { workListStyles } from './WorkListItem'
import { Checkbox, Fab } from '@material-ui/core'
import React, { useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { MoveToInbox } from '@material-ui/icons'
import WarningIcon from '@material-ui/icons/Warning'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import HourglassFullIcon from '@material-ui/icons/HourglassFull'
import NotesIcon from '@material-ui/icons/Notes'
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import _ from 'lodash'
import Badge from '@material-ui/core/Badge'
import { makeStyles } from '@material-ui/styles'
import { deleteOrDehilightMessages } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import ArchiveIcon from '@material-ui/icons/Archive'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import { messageText } from '../../../utils/messageUtils'
import { addExpansionPanel } from './InboxExpansionPanel'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'

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
  const { isJarDisplay = false } = props;
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const workItemClasses = workListStyles();
  const [checkAll, setCheckAll] = useState(false);
  const [determinate, setDeterminate] = useState({});
  const [indeterminate, setIndeterminate] = useState(false);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [commentState] = useContext(CommentsContext);
  const [marketState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [diffState] = useContext(DiffContext);
  const { messages: messagesUnsafe } = messagesState;

  useEffect(() => {
    let myIndeterminate = false;
    Object.keys(determinate).forEach((key) => {
      if (determinate[key] !== checkAll) {
        myIndeterminate = true;
      }
    });
    setIndeterminate(myIndeterminate);
  }, [checkAll, determinate])

  let messagesFull = (messagesUnsafe || []).filter((message) => message.type !== 'UNREAD_REPORT');
  let unreadCount = 0;
  if (isJarDisplay) {
    const messages = messagesFull.filter((message) => message.is_highlighted);
    unreadCount = messages.length;
  }

  let messagesOrdered;
  if (isJarDisplay) {
    messagesOrdered = _.orderBy(messagesFull, [(message) => {
      const { level, is_highlighted: isHighlighted } = message;
      if (!isHighlighted) {
        switch (level) {
          case 'RED':
            return 3;
          case 'YELLOW':
            return 2;
          default:
            return 1;
        }
      }
      switch (level) {
        case 'RED':
          return 6;
        case 'YELLOW':
          return 5;
        default:
          return 4;
      }}], ['desc'] ) || [];
  } else {
    messagesOrdered =  _.orderBy(messagesFull, ['updated_at'], ['desc']) || [];
  }
  const goFullInboxClick = (event) => {
    preventDefaultAndProp(event);
    navigate(history, '/inbox');
  };
  if (isJarDisplay) {
    const first = _.isEmpty(messagesFull) ? undefined : messagesOrdered[0];
    return (
      <div id='inboxNotification' key='inbox' onClick={goFullInboxClick} className={classes.bellButton}>
        <Badge badgeContent={unreadCount} className={classes.chip} overlap="circular">
          <Fab id='notifications-fabInbox' className={classes.fab}>
            <MoveToInbox
              htmlColor={ _.isEmpty(first) ? '#8f8f8f' :
                (first.level === 'RED' ? '#E85757' : (first.level === 'YELLOW' ? '#e6e969' : '#2D9CDB'))} />
          </Fab>
        </Badge>
      </div>
    );
  }

  const dupeHash = {};
  // Filter out duplicates by hashing on {type}_{link_multiple}
  messagesOrdered = messagesOrdered.filter((message) => {
    const { link_multiple: linkMultiple, type: aType } = message;
    if (linkMultiple) {
      const myHash = `${aType}_${linkMultiple}`;
      if (dupeHash[myHash]) {
        return false;
      }
      dupeHash[myHash] = true;
    }
    return true;
  });
  let containsUnread = false;
  const rows = messagesOrdered.map((message) => {
    const { level, investible_name: investible, updated_at: updatedAt, market_name: market,
      is_highlighted: isHighlighted, text, type_object_id: typeObjectId, market_id: marketId,
      comment_id: commentId, comment_market_id: commentMarketId } = message;
    const title = messageText(message, intl);
    const item = {
      title,
      description: text,
      icon: getPriorityIcon(level),
      market,
      investible,
      read: !isHighlighted,
      isDeletable: typeObjectId.startsWith('UNREAD'),
      date: intl.formatDate(updatedAt),
      message
    }
    if (isHighlighted) {
      containsUnread = true;
    }
    if (commentId) {
      let useMarketId = commentMarketId || marketId;
      const rootComment = getCommentRoot(commentState, useMarketId, commentId);
      if (rootComment) {
        const comment = nameFromDescription(rootComment.body);
        if (comment) {
          item.comment = comment;
        }
      }
    }
    addExpansionPanel(item, commentState, marketState, investiblesState, diffState);
    return <WorkListItem key={typeObjectId} id={typeObjectId} checkedDefault={checkAll}
                    setDeterminate={setDeterminate} determinate={determinate} {...item} />;
  });

  return (
    <div id="inbox">
      <div style={{display: 'flex'}}>
        <Checkbox style={{padding: 0}}
          checked={checkAll}
          indeterminate={indeterminate}
          disabled={!containsUnread}
          onChange={() => {
            setIndeterminate(false);
            setDeterminate({});
            setCheckAll(!checkAll);
          }}
        />
        {(checkAll || !_.isEmpty(determinate)) && (
          <TooltipIconButton disabled={operationRunning !== false}
                             icon={<ArchiveIcon htmlColor={ACTION_BUTTON_COLOR} />}
                             onClick={() => {
                               let toProcess = messagesFull.filter((message) => message.is_highlighted);
                               if (checkAll) {
                                 if (!_.isEmpty(determinate)) {
                                   const keys = Object.keys(determinate);
                                   toProcess = messagesFull.filter((message) => !keys.includes(message.type_object_id));
                                 }
                               } else {
                                 const keys = Object.keys(determinate);
                                 toProcess = messagesFull.filter((message) => keys.includes(message.type_object_id));
                               }
                               return deleteOrDehilightMessages(toProcess, messagesDispatch, workItemClasses.removed)
                                 .then(() => {
                                   setIndeterminate(false);
                                   setDeterminate({});
                                   setCheckAll(false);
                                   setOperationRunning(false);
                                 })
                                 .finally(() => {
                                   setOperationRunning(false);
                                 });
                             }} translationId="inboxArchive" />
        )}
      </div>
      { rows }
    </div>
  );
}

export default Inbox;