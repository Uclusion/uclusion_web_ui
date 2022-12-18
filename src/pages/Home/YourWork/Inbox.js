import { workListStyles } from './WorkListItem'
import { Box, Checkbox, IconButton, useMediaQuery, useTheme } from '@material-ui/core'
import React, { useContext, useEffect, useReducer } from 'react'
import { useIntl } from 'react-intl'
import { Group as GroupIcon, ExpandLess, KeyboardArrowLeft, Inbox as InboxIcon } from '@material-ui/icons'
import OutboxIcon from '../../../components/CustomChip/Outbox'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import _ from 'lodash'
import { deleteOrDehilightMessages } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import ArchiveIcon from '@material-ui/icons/Archive'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getInboxCount } from '../../../contexts/NotificationsContext/notificationsContextHelper'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import InboxRow from './InboxRow'
import { getPaginatedItems } from '../../../utils/messageUtils'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox'
import { createDefaultInboxRow } from './InboxExpansionPanel'
import Outbox from './Outbox'
import {
  contractAll,
  expandAll,
  getUnpaginatedItems,
  PAGE_SIZE,
  PENDING_INDEX,
  setPage,
  setTab
} from './InboxContext'

function Inbox(props) {
  const { isDisabled = false, loadingFromInvite=false, messagesFull, inboxState, inboxDispatch,
    messagesHash } = props;
  const intl = useIntl();
  const workItemClasses = workListStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [, , tokensHash] = useContext(MarketsContext);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { tabIndex, page, expansionState } = inboxState;
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
  const unreadCount = getInboxCount(messagesState, marketState, marketPresencesState, commentsState, investiblesState);
  const firstMessage = _.isEmpty(messagesFull) ? undefined : messagesJarOrdered[0];
  const htmlColor = _.isEmpty(firstMessage) ? '#8f8f8f' :
    (firstMessage.level === 'RED' ? '#E85757' : (firstMessage.level === 'YELLOW' ?
      (isDisabled ? '#ffff00' : '#ffc61a') : '#2D9CDB'));
  const unpaginatedItems = getUnpaginatedItems(messagesHash, tabIndex);

  useEffect(() => {
    // If the last item on a page is deleted then must go down
    if ((page - 1)*PAGE_SIZE + 1 > _.size(unpaginatedItems)) {
      if (page > 1) {
        const lastAvailablePage = Math.ceil(_.size(unpaginatedItems)/PAGE_SIZE);
        inboxDispatch(setPage(lastAvailablePage > 0 ? lastAvailablePage : 1));
      }
    }
  }, [unpaginatedItems, page, inboxDispatch]);

  function changePage(byNum) {
    inboxDispatch(setPage(page + byNum));
  }

  const { first, last, data, hasMore, hasLess } = getPaginatedItems(unpaginatedItems, page, PAGE_SIZE);
  const defaultRow = createDefaultInboxRow(unpaginatedItems, loadingFromInvite, messagesState, tokensHash, intl,
    determinate, determinateDispatch, checkAll, tabIndex);
  const {outBoxMessagesOrdered, teamMessagesOrdered } = messagesHash;

  return (
    <>
    <div style={{zIndex: 8, position: 'fixed', width: '100%', marginLeft: '-0.5rem'}}>
      <GmailTabs
        value={tabIndex}
        onChange={(event, value) => {
          inboxDispatch(setTab(value));
        }}
        indicatorColors={[htmlColor, '#00008B', '#00008B']}
        style={{ paddingBottom: '0.5rem', paddingTop: '1rem', marginTop: '-1rem' }}>
        <GmailTabItem icon={<InboxIcon htmlColor={htmlColor} />} label={intl.formatMessage({id: 'unread'})}
                      color='black' tagLabel={intl.formatMessage({id: 'new'})}
                      tag={unreadCount > 0 && !mobileLayout ? `${unreadCount}` : undefined} />
        <GmailTabItem icon={<GroupIcon />} label={intl.formatMessage({id: 'teamUnresolved'})}
                      tag={_.size(teamMessagesOrdered) > 0 && !mobileLayout ?
                        `${_.size(teamMessagesOrdered)}` : undefined} />
        <GmailTabItem icon={<OutboxIcon />} label={intl.formatMessage({id: 'outbox'})}
                      tag={_.size(outBoxMessagesOrdered) > 0 && !mobileLayout ?
                        `${_.size(outBoxMessagesOrdered)}` : undefined} />
      </GmailTabs>
      <div style={{paddingBottom: '0.25rem', backgroundColor: 'white'}}>
        <div style={{display: 'flex', width: '80%'}}>
          {!mobileLayout && (
            <Checkbox style={{padding: 0, marginLeft: '0.6rem'}}
                      checked={checkAll}
                      indeterminate={indeterminate}
                      disabled={PENDING_INDEX === tabIndex}
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
              }} translationId={tabIndex === 0 ? 'inboxMarkRead' : 'inboxArchive'} />
          )}
          <TooltipIconButton icon={<ExpandLess style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                             onClick={() => {
                               inboxDispatch(contractAll());
                             }} translationId="inboxCollapseAll" />
          <TooltipIconButton icon={<ExpandMoreIcon style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                             onClick={() => {
                               inboxDispatch(expandAll());
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
      </div>
    </div>
    <div id="inbox" style={{paddingBottom: '45vh', paddingTop: '8rem'}}>
      {defaultRow}
      { data.map((message) => {
          if (message.isOutboxType) {
            return React.Fragment;
          }
          const isDeletable =  message.type_object_id.startsWith('UNREAD');
          const determinateChecked = determinate[message.type_object_id];
          const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
          return <InboxRow message={message} inboxDispatch={inboxDispatch}
                           determinateDispatch={determinateDispatch}
                           expansionOpen={!!expansionState[message.type_object_id]}
                           isDeletable={isDeletable} checked={checked} />;
      })}
      <Outbox inboxState={inboxState} inboxDispatch={inboxDispatch} page={page} messagesOrdered={data} />
    </div>
    </>
  );
}

export default Inbox;