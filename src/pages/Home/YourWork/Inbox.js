import { workListStyles } from './WorkListItem'
import { Box, Checkbox, Fab, IconButton, useMediaQuery, useTheme } from '@material-ui/core'
import React, { useContext, useEffect, useReducer, useState } from 'react'
import { useIntl } from 'react-intl'
import { AlarmOn, ExpandLess, KeyboardArrowLeft, Inbox as InboxIcon } from '@material-ui/icons'
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
import InboxRow from './InboxRow'
import { getPaginatedItems } from '../../../utils/messageUtils'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox'
import { createDefaultInboxRow, getOutboxMessages } from './InboxExpansionPanel'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { usePlanningInvestibleStyles } from '../../Investible/Planning/PlanningInvestible'
import Outbox from './Outbox'
import { pushMessage } from '../../../utils/MessageBusUtils'
import {
  MODIFY_NOTIFICATIONS_CHANNEL,
  REMOVE_CURRENT_EVENT
} from '../../../contexts/NotificationsContext/notificationsContextMessages'
import AssignmentIcon from '@material-ui/icons/Assignment'

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

const PAGE_SIZE = 15;
export const PENDING_INDEX = 2;
export const ASSIGNED_INDEX = 1;

function Inbox(props) {
  const { isJarDisplay = false, isDisabled = false, expansionState = {}, expansionDispatch, page, setPage,
    loadingFromInvite=false, setPendingPage, pendingPage, setAssignedPage, assignedPage,
    expansionPendingDispatch, expansionPendingState, expansionAssignedState, expansionAssignedDispatch } = props;
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const workItemClasses = workListStyles();
  const planningClasses = usePlanningInvestibleStyles();
  const [tabIndex, setTabIndex] = useState(0);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
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
    return isInInbox(message, marketState, marketPresencesState, commentsState, investiblesState, messagesUnsafe);
  });
  const messagesJarOrdered = _.orderBy(messagesFull, [(message) => {
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
  let inboxMessagesOrdered =  _.orderBy(messagesFull, ['updated_at'], ['desc']) || [];
  const goFullInboxClick = (event) => {
    preventDefaultAndProp(event);
    navigate(history, '/inbox');
  };
  const unreadCount = getInboxCount(messagesState, marketState, marketPresencesState, commentsState, investiblesState);
  const firstMessage = _.isEmpty(messagesFull) ? undefined : messagesJarOrdered[0];
  const htmlColor = _.isEmpty(firstMessage) ? '#8f8f8f' :
    (firstMessage.level === 'RED' ? '#E85757' : (firstMessage.level === 'YELLOW' ?
      (isDisabled ? '#ffff00' : (isJarDisplay ? '#FCEC69' : '#ffc61a')) : '#2D9CDB'));
  const outBoxMessagesOrdered = getOutboxMessages({messagesState, marketState, marketPresencesState,
    investiblesState, marketStagesState, commentsState, planningClasses, mobileLayout,
    expansionState: expansionPendingState, intl});
  const assignedMessages = (messagesUnsafe || []).filter((message) => message.alert_type);
  const assignedMessagesOrdered = _.orderBy(assignedMessages, ['updated_at'], ['desc']) || [];
  const messagesFiltered = _.isEmpty(search) ? inboxMessagesOrdered : inboxMessagesOrdered.filter((message) => {
    const { type_object_id: typeObjectId,  investible_id: investibleId } = message;
    return results.find((result) => typeObjectId.endsWith(result.id) || result.id === investibleId) ||
      parentResults.find((id) => typeObjectId.endsWith(id) || parentResults.find((id) => investibleId === id));
  });
  const dupeHash = {};
  messagesFiltered.forEach((message) => {
    const { link_multiple: linkMultiple } = message;
    if (linkMultiple) {
      if (dupeHash[linkMultiple]) {
        dupeHash[linkMultiple].push(message);
      } else {
        dupeHash[linkMultiple] = [message];
      }
    }
  });
  inboxMessagesOrdered = messagesFiltered.filter((message) => {
    const { link_multiple: linkMultiple, updated_at: updatedAt } = message;
    if (dupeHash[linkMultiple]) {
      //Choose the message to use for the row based on last updated
      return _.isEmpty(dupeHash[linkMultiple].find((aMessage) => {
        return aMessage.updated_at > updatedAt;
      }));
    }
    return true;
  });
  const unpaginatedItems = tabIndex === PENDING_INDEX ? outBoxMessagesOrdered : (tabIndex === 0 ? inboxMessagesOrdered
    : assignedMessagesOrdered);
  const usePage = tabIndex === PENDING_INDEX ? pendingPage : (tabIndex === 0 ? page : assignedPage);

  useEffect(() => {
    // If the last item on a page is deleted then must go down
    const pageSetter = tabIndex === PENDING_INDEX ? setPendingPage : ( tabIndex === 0 ? setPage : setAssignedPage);
    if ((usePage - 1)*PAGE_SIZE + 1 > _.size(unpaginatedItems)) {
      if (usePage > 1) {
        const lastAvailablePage = Math.ceil(_.size(unpaginatedItems)/PAGE_SIZE);
        pageSetter(lastAvailablePage > 0 ? lastAvailablePage : 1);
      }
    }
  }, [tabIndex, setPage, setPendingPage, unpaginatedItems, usePage, setAssignedPage]);

  if (isJarDisplay) {
    return (
      <div id='inboxNotification' key='inbox' onClick={goFullInboxClick} className={classes.bellButton}>
        <Badge badgeContent={unreadCount} className={classes.chip} overlap="circular">
          <Fab id='notifications-fabInbox' className={classes.fab} disabled={isDisabled}>
            <InboxIcon htmlColor="black" />
          </Fab>
        </Badge>
      </div>
    );
  }

  function changePage(byNum) {
    if (tabIndex === PENDING_INDEX) {
      setPendingPage(pendingPage + byNum);
    } else if (tabIndex === 0) {
      setPage(page + byNum);
    } else {
      setAssignedPage(assignedPage + byNum)
    }
  }

  const { first, last, data, hasMore, hasLess } = getPaginatedItems(unpaginatedItems, usePage, PAGE_SIZE);
  const defaultRow = createDefaultInboxRow(unpaginatedItems, loadingFromInvite, messagesState, tokensHash, intl,
    determinate, determinateDispatch, checkAll, expansionState, expansionDispatch, tabIndex);

  return (
    <div id="inbox" style={{paddingBottom: '45vh'}}>
      <div style={{display: 'flex', paddingBottom: '0.5rem'}}>
        {!mobileLayout && (
          <Checkbox style={{padding: 0, marginLeft: '0.6rem'}}
                    checked={checkAll}
                    indeterminate={indeterminate}
                    disabled={_.isEmpty(inboxMessagesOrdered)}
                    onChange={() => determinateDispatch({type: 'toggle'})}
          />
        )}
        {(checkAll || !_.isEmpty(determinate)) && (
          <TooltipIconButton
            icon={<ArchiveIcon htmlColor={ACTION_BUTTON_COLOR} />}
            onClick={() => {
               let toProcess = messagesFull.filter((message) => message.is_highlighted ||
                 message.type_object_id.startsWith('UNREAD'));
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
                 }).finally(() => {
                   setOperationRunning(false);
                 });
             }} translationId="inboxArchive" />
        )}
        <TooltipIconButton icon={<ExpandLess style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                           onClick={() => {
                             if (tabIndex === PENDING_INDEX) {
                               expansionPendingDispatch({ contractAll: true });
                             } else if (tabIndex === ASSIGNED_INDEX) {
                               expansionAssignedDispatch({ expandAll: false });
                             } else {
                               expansionDispatch({ expandAll: false });
                             }
                           }} translationId="inboxCollapseAll" />
        <TooltipIconButton icon={<ExpandMoreIcon style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                           onClick={() => {
                             if (tabIndex === PENDING_INDEX) {
                               expansionPendingDispatch({expandedMessages: outBoxMessagesOrdered});
                             } else if (tabIndex === ASSIGNED_INDEX) {
                               expansionAssignedDispatch({ expandAll: true });
                             } else {
                               expansionDispatch({ expandAll: true });
                             }
                           }} translationId="inboxExpandAll" />
        <div style={{flexGrow: 1}}/>
        <Box fontSize={14} color="text.secondary">
          {first} - {last} of {_.size(unpaginatedItems) > 0 ? _.size(unpaginatedItems) : 1}
          <IconButton disabled={!hasLess} onClick={() => changePage(-1)} >
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton disabled={!hasMore} onClick={() => changePage(1)}>
            <KeyboardArrowRight />
          </IconButton>
        </Box>
      </div>
      <GmailTabs
        value={tabIndex}
        onChange={(event, value) => {
          pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: REMOVE_CURRENT_EVENT });
          setTabIndex(value);
        }}
        indicatorColors={[htmlColor, '#00008B', '#00008B']}
        style={{ borderTop: '1px ridge lightgrey', paddingBottom: '0.25rem' }}>
        <GmailTabItem icon={<InboxIcon htmlColor={htmlColor} />} label={intl.formatMessage({id: 'inbox'})}
                      color='black'
                      tag={unreadCount > 0 ? `${unreadCount} unread` : undefined} />
        <GmailTabItem icon={<AssignmentIcon />} label={intl.formatMessage({id: 'unreadAssignmentMobile'})}
                      color='#055099'
                      tag={_.size(assignedMessagesOrdered) > 0 ? `${_.size(assignedMessagesOrdered)}` : undefined} />
        <GmailTabItem icon={<AlarmOn />} label={intl.formatMessage({id: 'outbox'})} color='#055099'
                      tag={_.size(outBoxMessagesOrdered) > 0 ? `${_.size(outBoxMessagesOrdered)}` : undefined} />
      </GmailTabs>
      {defaultRow}
      { tabIndex === PENDING_INDEX ? <Outbox expansionState={expansionPendingState}
                                             expansionDispatch={expansionPendingDispatch}
                                             page={pendingPage} setPage={setPendingPage} messagesOrdered={data} /> :
        data.map((message) => {
          const { link_multiple: linkMultiple } = message;
          const linkMultiples = dupeHash[linkMultiple] || [];
          const numMultiples = _.size(_.uniqBy(linkMultiples, 'type'));
          const fullyVotedMessage = linkMultiples.find((message) => message.type === 'FULLY_VOTED');
          const isMultiple = !fullyVotedMessage && numMultiples > 1;
          const isDeletable = linkMultiples.find((message) => message.type_object_id.startsWith('UNREAD'));
          const useMessage = fullyVotedMessage || message;
          const determinateChecked = determinate[useMessage.type_object_id];
          const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
          const useExpansionState = tabIndex === ASSIGNED_INDEX ? expansionAssignedState : expansionState;
          return <InboxRow message={useMessage} expansionDispatch={tabIndex === ASSIGNED_INDEX ?
            expansionAssignedDispatch : expansionDispatch} numMultiples={numMultiples}
                           determinateDispatch={determinateDispatch} showPriority={tabIndex !== ASSIGNED_INDEX}
                           expansionOpen={!!useExpansionState[useMessage.type_object_id]}
                           isDeletable={isDeletable} isMultiple={isMultiple} checked={checked} />;
      }) }
    </div>
  );
}

export default Inbox;