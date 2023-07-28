import WorkListItem from './WorkListItem';
import { Box, Checkbox, IconButton, useMediaQuery, useTheme } from '@material-ui/core';
import React, { useContext, useEffect, useReducer } from 'react';
import { useIntl } from 'react-intl';
import { ArrowBack, Delete, Group as GroupIcon, Inbox as InboxIcon, KeyboardArrowLeft } from '@material-ui/icons';
import OutboxIcon from '../../../components/CustomChip/Outbox';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import _ from 'lodash';
import { deleteOrDehilightMessages } from '../../../api/users';
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getInboxCount, getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import InboxRow from './InboxRow';
import { getPaginatedItems } from '../../../utils/messageUtils';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import { calculateTitleExpansionPanel, createDefaultInboxRow } from './InboxExpansionPanel';
import { getUnpaginatedItems, PAGE_SIZE, setPage, setTab } from './InboxContext';
import { nameFromDescription } from '../../../utils/stringFunctions';
import { setOperationInProgress } from '../../../components/ContextHacks/OperationInProgressGlobalProvider';
import { getDeterminateReducer } from '../../../contexts/ContextUtils';
import { formInboxItemLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function Inbox(props) {
  const { loadingFromInvite=false, messagesFull, inboxState, inboxDispatch, messagesHash, searchResults,
    workItemId } = props;
  const intl = useIntl();
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, , tokensHash] = useContext(MarketsContext);
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { tabIndex, page } = inboxState;
  const { search } = searchResults;
  const [determinateState, determinateDispatch] = useReducer(getDeterminateReducer(),
    {determinate: {}, indeterminate: false, checkAll: false});
  const { indeterminate, determinate, checkAll } = determinateState;
  const unreadCount = _.isEmpty(search) ? getInboxCount(messagesState) : 0;
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

  const { first, last, data, hasMore, hasLess, previousItemId, nextItemId, current } =
    getPaginatedItems(unpaginatedItems, page, PAGE_SIZE, workItemId);
  const defaultRow = createDefaultInboxRow(unpaginatedItems, loadingFromInvite, messagesState, tokensHash, intl,
    determinate, determinateDispatch, checkAll, tabIndex);
  const { outBoxMessagesOrdered, inboxMessagesOrdered, teamMessagesOrdered } = messagesHash;
  const htmlColor = _.isEmpty(inboxMessagesOrdered) ? '#8f8f8f' : (unreadCount > 0 ? '#E85757' : '#2D9CDB');
  return (
    <>
    <div style={{zIndex: 8, position: 'fixed', width: '100%', marginLeft: '-0.5rem',
      marginTop: mobileLayout ? '-30px' : (workItemId ? '-15px' : '-8px')}} id="inbox-header">
      {!workItemId && (
        <GmailTabs
          value={tabIndex}
          onChange={(event, value) => {
            window.scrollTo(0, 0);
            inboxDispatch(setTab(value));
          }}
          indicatorColors={[htmlColor, '#00008B', '#00008B']}
          style={{ paddingBottom: '0.5rem', paddingTop: '1rem', marginTop: '-1rem' }}>
          <GmailTabItem icon={<InboxIcon htmlColor={htmlColor} />} label={intl.formatMessage({id: 'unread'})}
                        color='black' tagLabel={unreadCount > 0 ? intl.formatMessage({id: 'new'}) : undefined}
                        tagColor={unreadCount > 0 ? '#E85757' : undefined}
                        tag={unreadCount > 0 ? `${unreadCount}` :
                          (_.size(inboxMessagesOrdered) > 0 ? `${_.size(inboxMessagesOrdered)}` : undefined)} />
          <GmailTabItem icon={<GroupIcon />} label={intl.formatMessage({id: 'teamUnresolved'})}
                        tag={_.size(teamMessagesOrdered) > 0 ?
                          `${_.size(teamMessagesOrdered)}` : undefined} />
          <GmailTabItem icon={<OutboxIcon />} label={intl.formatMessage({id: 'outbox'})}
                        tag={_.size(outBoxMessagesOrdered) > 0 ?
                          `${_.size(outBoxMessagesOrdered)}` : undefined} />
        </GmailTabs>
      )}
      <div style={{paddingBottom: '0.25rem', backgroundColor: 'white'}}>
        <div style={{display: 'flex', width: '80%'}}>
          {!mobileLayout && 0 === tabIndex && !workItemId && (
            <Checkbox style={{padding: 0, marginLeft: '0.6rem'}}
                      checked={checkAll}
                      indeterminate={indeterminate}
                      onChange={() => determinateDispatch({type: 'toggle'})}
            />
          )}
          {(checkAll || !_.isEmpty(determinate)) && 0 === tabIndex && !workItemId && (
            <TooltipIconButton
              icon={<Delete htmlColor={ACTION_BUTTON_COLOR} />}
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
                return deleteOrDehilightMessages(toProcess, messagesDispatch)
                  .then(() => {
                    determinateDispatch({type: 'clear'});
                  }).finally(() => {
                    setOperationInProgress(false);
                  });
              }} translationId="inboxMarkRead" />
          )}
          {workItemId && (
            <TooltipIconButton icon={<ArrowBack style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                               onClick={() => {
                                 navigate(history, getInboxTarget());
                               }} translationId="backToInbox" />
          )}
          <div style={{flexGrow: 1}}/>
          <Box fontSize={14} color="text.secondary">
            {workItemId && (
              `${current} of ${_.size(unpaginatedItems) > 0 ? _.size(unpaginatedItems) : 1}`
            )}
            {!workItemId && (
              `${first} - ${last} of ${_.size(unpaginatedItems) > 0 ? _.size(unpaginatedItems) : 1}`
            )}
            <IconButton disabled={!hasLess} onClick={() => workItemId ?
              navigate(history, formInboxItemLink(previousItemId)) : changePage(-1)} >
              <KeyboardArrowLeft />
            </IconButton>
            <IconButton disabled={!hasMore} onClick={() => workItemId ?
              navigate(history, formInboxItemLink(nextItemId)) : changePage(1)}>
              <KeyboardArrowRight />
            </IconButton>
          </Box>
        </div>
      </div>
    </div>
    <div id="inbox" style={{paddingTop: workItemId ? undefined : '7rem'}}>
      {defaultRow}
      { data.map((message) => {
          if (message.isOutboxType || !message.type_object_id) {
            return React.Fragment;
          }
          const isDeletable =  message.type_object_id.startsWith('UNREAD');
          const determinateChecked = determinate[message.type_object_id];
          const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
          return <InboxRow message={message} key={message.type_object_id}
                           determinateDispatch={determinateDispatch}
                           expansionOpen={workItemId === message.type_object_id}
                           isDeletable={isDeletable} checked={checked} />;
      })}
      {
        data.map((message) => {
          if (!message.isOutboxType) {
            return React.Fragment;
          }
          const { id, investible, updatedAt, title, icon, comment, debtors, expansionPanel } = message;
          const item = {
            title,
            read: true,
            isDeletable: false,
            people: debtors,
            date: intl.formatDate(updatedAt),
            expansionPanel,
            icon,
            message
          }

          if (investible) {
            item.investible = investible;
          }
          if (comment) {
            const commentName = nameFromDescription(comment);
            if (commentName) {
              item.comment = commentName;
            }
          }
          const expansionOpen = workItemId === id;
          calculateTitleExpansionPanel({ item, intl, openExpansion: expansionOpen });
          return <WorkListItem id={id} useSelect={false} {...item} key={id} expansionOpen={expansionOpen} />;
        })
      }
    </div>
    </>
  );
}

export default Inbox;