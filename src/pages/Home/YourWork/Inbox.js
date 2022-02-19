import WorkListItem, { workListStyles } from './WorkListItem'
import { Box, Checkbox, Fab, useMediaQuery, useTheme } from '@material-ui/core'
import React, { useContext, useReducer } from 'react'
import { useIntl } from 'react-intl'
import { ExpandLess, MoveToInbox, Weekend } from '@material-ui/icons'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import _ from 'lodash'
import Badge from '@material-ui/core/Badge'
import { makeStyles } from '@material-ui/styles'
import { deleteOrDehilightMessages } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import ArchiveIcon from '@material-ui/icons/Archive'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getInboxCount, isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { hasNoChannels } from '../../../contexts/MarketsContext/marketsContextHelper'
import InboxRow from './InboxRow'

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
  const { isJarDisplay = false, isDisabled = false, expansionState, expansionDispatch } = props;
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const workItemClasses = workListStyles();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, , tokensHash] = useContext(MarketsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [determinateState, determinateDispatch] = useReducer((state, action) => {
    const { determinate, checkAll } = state;
    const { type, id } = action;
    let newDeterminate = determinate;
    let newCheckAll = checkAll;
    if (type === 'clear') {
      newDeterminate = {};
      newCheckAll = false;
    } else if (type === 'toggle') {
      newCheckAll = !checkAll;
    } else if (id !== undefined) {
      const newValue = determinate[id] === undefined ? !checkAll : !determinate[id];
      if (newValue === checkAll) {
        newDeterminate = _.omit(determinate, id);
      } else {
        newDeterminate = {...determinate, [id]: newValue};
      }
    }
    let newIndeterminate = false;
    Object.keys(newDeterminate).forEach((key) => {
      if (newDeterminate[key] !== newCheckAll) {
        newIndeterminate = true;
      }
    });
    return { determinate: newDeterminate, indeterminate: newIndeterminate, checkAll: newCheckAll};
  }, {determinate: {}, indeterminate: false, checkAll: false});
  const { indeterminate, determinate, checkAll } = determinateState;
  const { messages: messagesUnsafe } = messagesState;
  let messagesFull = (messagesUnsafe || []).filter((message) => {
    return isInInbox(message, marketState, marketPresencesState);
  });
  let messagesOrdered;
  if (isJarDisplay) {
    messagesOrdered = _.orderBy(messagesFull, [(message) => {
      const { level } = message;
      // Ignore read or not because not relevant to the priority of the inbox
      switch (level) {
        case 'RED':
          return 3;
        case 'YELLOW':
          return 2;
        default:
          return 1;
      }
      }], ['desc'] ) || [];
  } else {
    messagesOrdered =  _.orderBy(messagesFull, ['updated_at'], ['desc']) || [];
  }
  const goFullInboxClick = (event) => {
    preventDefaultAndProp(event);
    navigate(history, '/inbox');
  };
  if (isJarDisplay) {
    const unreadCount = getInboxCount(messagesState, marketState, marketPresencesState);
    const first = _.isEmpty(messagesFull) ? undefined : messagesOrdered[0];
    return (
      <div id='inboxNotification' key='inbox' onClick={goFullInboxClick} className={classes.bellButton}>
        <Badge badgeContent={unreadCount} className={classes.chip} overlap="circular">
          <Fab id='notifications-fabInbox' className={classes.fab} disabled={isDisabled}>
            <MoveToInbox
              htmlColor={ _.isEmpty(first) ? '#8f8f8f' :
                (first.level === 'RED' ? '#E85757' : (first.level === 'YELLOW' ? (isDisabled ? '#ffff00' :'#FCEC69')
                  : '#2D9CDB'))} />
          </Fab>
        </Badge>
      </div>
    );
  }

  const messagesFiltered = _.isEmpty(search) ? messagesOrdered : messagesOrdered.filter((message) => {
    const { type_object_id: typeObjectId,  investible_id: investibleId } = message;
    return results.find((result) => typeObjectId.endsWith(result.id) || result.id === investibleId) ||
      parentResults.find((id) => typeObjectId.endsWith(id) || parentResults.find((id) => investibleId === id));
  });
  const dupeHash = {};
  // Filter out duplicates by hashing on {type}_{link_multiple}
  messagesOrdered = messagesFiltered.filter((message) => {
    const { link_multiple: linkMultiple } = message;
    if (linkMultiple) {
      if (dupeHash[linkMultiple]) {
        dupeHash[linkMultiple].push(message);
        return false;
      }
      dupeHash[linkMultiple] = [message];
    }
    return true;
  });
  const containsUnread = messagesOrdered.find((message) => message.is_highlighted);
  const notificationsText = _.size(messagesOrdered) !== 1 ? intl.formatMessage({ id: 'notifications' }) :
    intl.formatMessage({ id: 'notification' });
  return (
    <div id="inbox">
      <div style={{display: 'flex', paddingBottom: '0.5rem'}}>
        {!mobileLayout && (
          <Checkbox style={{padding: 0}}
                    checked={checkAll}
                    indeterminate={indeterminate}
                    disabled={!containsUnread}
                    onChange={() => determinateDispatch({type: 'toggle'})}
          />
        )}
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
                                   determinateDispatch({type: 'clear'});
                                   setOperationRunning(false);
                                 })
                                 .finally(() => {
                                   setOperationRunning(false);
                                 });
                             }} translationId="inboxArchive" />
        )}
        <TooltipIconButton icon={<ExpandLess style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                           onClick={() => expansionDispatch({expandAll: false})} translationId="inboxCollapseAll" />
        <TooltipIconButton icon={<ExpandMoreIcon style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                           onClick={() => expansionDispatch({expandAll: true})} translationId="inboxExpandAll" />
        <div style={{flexGrow: 1}}/>
        <Box fontSize={14} color="text.secondary">
          {_.size(messagesOrdered)} {notificationsText}
        </Box>
      </div>
      {_.isEmpty(messagesOrdered) && !hasNoChannels(tokensHash) && (
        <WorkListItem key='emptyInbox' id='emptyInbox' useSelect={false} {...{
          title: intl.formatMessage({ id: 'enjoy' }),
          market: intl.formatMessage({ id: 'noNew' }),
          icon: <Weekend style={{fontSize: 24, color: '#2D9CDB',}}/>,
          read: false,
          isDeletable: false,
          message: {link: '/outbox'}
        }} />
      )}
      { messagesOrdered.map((message) => {
        const { type_object_id: typeObjectId, link_multiple: linkMultiple } = message;
        const linkMultiples = dupeHash[linkMultiple];
        const fullyVotedMessage = (linkMultiples || []).find((message) => message.type === 'FULLY_VOTED');
        const isMultiple = !fullyVotedMessage && _.size(linkMultiples) > 1;
        const hasPersistent = (linkMultiples || []).find((message) =>
          !message.type_object_id.startsWith('UNREAD'));
        const useMessage = fullyVotedMessage || message;
        return <InboxRow message={useMessage} expansionDispatch={expansionDispatch} numMultiples={_.size(linkMultiples)}
                         determinateDispatch={determinateDispatch} expansionOpen={!!expansionState[typeObjectId]}
                         hasPersistent={hasPersistent} isMultiple={isMultiple}
                         checked={determinate[typeObjectId] !== undefined ? determinate[typeObjectId] : checkAll} />;
      }) }
    </div>
  );
}

export default React.memo(Inbox);