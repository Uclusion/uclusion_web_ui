import WorkListItem from './WorkListItem';
import { Box, Checkbox, useMediaQuery, useTheme } from '@material-ui/core';
import React, { useContext, useEffect, useReducer } from 'react';
import { useIntl } from 'react-intl';
import { ArrowBack, Inbox as InboxIcon, KeyboardArrowLeft, NotificationsActive } from '@material-ui/icons';
import OutboxIcon from '../../../components/CustomChip/Outbox';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import _ from 'lodash';
import { deleteOrDehilightMessages } from '../../../api/users';
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import {
  dehighlightMessage,
  getInboxCount,
  getInboxTarget, getMessageId
} from '../../../contexts/NotificationsContext/notificationsContextHelper';
import InboxRow from './InboxRow';
import { getPaginatedItems } from '../../../utils/messageUtils';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import { calculateTitleExpansionPanel, createDefaultInboxRow } from './InboxExpansionPanel';
import { getUnpaginatedItems, PAGE_SIZE, setPage, setTab } from './InboxContext';
import { stripHTML } from '../../../utils/stringFunctions';
import { getDeterminateReducer } from '../../../contexts/ContextUtils';
import {
  formInboxItemLink,
  formMarketLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import NotificationDeletion from './NotificationDeletion';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getMarketClient } from '../../../api/marketLogin';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import { useHotkeys } from 'react-hotkeys-hook';

function createWorkspaceGroupHeader(market, group, history) {
  const link = formMarketLink(market.id, group.id);
  return (<div id={`inboxGroupHeader${group.id}`} key={`inboxGroupHeaderKey${group.id}`} style={{marginTop: '0.3rem'}}>
    Workspace {market.name} and view <Link href={link} onClick={
    (event) => {
      preventDefaultAndProp(event);
      navigate(history, link);
    }
  }>{group.name}</Link>
  </div>);
}

function Inbox(props) {
  const { messagesFull, inboxState, inboxDispatch, messagesHash, searchResults, workItemId, hidden } = props;
  const intl = useIntl();
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [marketsState] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { tabIndex, page } = inboxState;
  const { search } = searchResults;
  const [determinateState, determinateDispatch] = useReducer(getDeterminateReducer(),
    {determinate: {}, indeterminate: false, checkAll: false});
  const { indeterminate, determinate, checkAll } = determinateState;
  const [determinateStateOutbox, determinateDispatchOutbox] = useReducer(getDeterminateReducer(),
    {determinate: {}, indeterminate: false, checkAll: false});
  const { indeterminate: indeterminateOutbox, determinate: determinateOutbox,
    checkAll: checkAllOutbox } = determinateStateOutbox;
  const unreadCount = _.isEmpty(search) ? getInboxCount(messagesState) : 0;
  const unpaginatedItems = getUnpaginatedItems(messagesHash, tabIndex, workItemId);
  useEffect(() => {
    if (page) {
      // If the last item on a page is deleted then must go down
      if ((page - 1)*PAGE_SIZE + 1 > _.size(unpaginatedItems)) {
        if (page > 1) {
          const lastAvailablePage = Math.ceil(_.size(unpaginatedItems)/PAGE_SIZE);
          inboxDispatch(setPage(lastAvailablePage > 0 ? lastAvailablePage : 1));
        }
      }
    }
  }, [unpaginatedItems, page, inboxDispatch]);

  useEffect(() => {
    // If on first tab and trying to return to second tab panel
    if (!hidden && workItemId) {
      if (!workItemId.includes('_')&&tabIndex === 0) {
        inboxDispatch(setTab(1));
      }
    }
  }, [hidden, inboxDispatch, tabIndex, workItemId]);

  function changePage(byNum) {
    inboxDispatch(setPage(page + byNum));
  }

  function goToItem(itemId) {
    const { messages } = messagesState || {};
    const itemMessage = messages?.find((message) => message.type_object_id === itemId && message.is_highlighted);
    if (itemMessage) {
      dehighlightMessage(itemMessage, messagesDispatch);
      navigate(history, formInboxItemLink(itemMessage));
    }
  }

  const { first, last, data, hasMore, hasLess, previousItemId, nextItemId, current } =
    getPaginatedItems(unpaginatedItems, page, PAGE_SIZE, workItemId);
  const isOnWorkItem = workItemId && current > 0;
  const defaultRow = createDefaultInboxRow(unpaginatedItems, tabIndex);
  const { outBoxMessagesOrdered, inboxMessagesOrdered } = messagesHash;
  const htmlColor = _.isEmpty(inboxMessagesOrdered) ? '#8f8f8f' : (unreadCount > 0 ? '#E85757' : '#2D9CDB');

  function getRows(isInbox) {
    const rows = [];
    let currentWorkSpaceGroupId = undefined;
    data.forEach((message) => {
      const isOutbox = message.isOutboxType || !message.type_object_id;
      if (currentWorkSpaceGroupId !== message.groupAttr && !isOnWorkItem) {
        currentWorkSpaceGroupId = message.groupAttr;
        const group = getGroup(groupsState, undefined, message.group_id);
        if (group) {
          const market = getMarket(marketsState, group.market_id);
          if (market) {
            if ((isInbox && !isOutbox)||(!isInbox && isOutbox)) {
              rows.push(createWorkspaceGroupHeader(market, group, history));
            }
          }
        }
      }
      if (isOutbox) {
        if (!isInbox) {
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
          };

          if (investible) {
            item.investible = investible;
          }
          if (comment) {
            const commentName = stripHTML(comment);
            if (commentName) {
              item.comment = commentName;
            }
          }
          const expansionOpen = isOnWorkItem && workItemId === id;
          calculateTitleExpansionPanel({ item, intl, openExpansion: expansionOpen });
          const determinateChecked = determinateOutbox[message.id];
          const checked = determinateChecked !== undefined ? determinateChecked : checkAllOutbox;
          rows.push(<WorkListItem id={id} useSelect {...item} key={id} expansionOpen={expansionOpen}
                                  determinateDispatch={determinateDispatchOutbox} checked={checked}/>);
        }
      } else {
        if (isInbox) {
          const isDeletable = message.type_object_id.startsWith('UNREAD');
          const determinateChecked = determinate[message.type_object_id];
          const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
          if (!isOnWorkItem || workItemId === getMessageId(message)) {
            rows.push(<InboxRow message={message} key={getMessageId(message)}
                                     determinateDispatch={determinateDispatch}
                                     expansionOpen={isOnWorkItem}
                                     isDeletable={isDeletable} checked={checked}/>);
          }
        }
      }
    });
    return rows;
  }

  const goPreviousFunc = () => isOnWorkItem ? goToItem(previousItemId) : changePage(-1);
  const goNextFunc = () => isOnWorkItem ? goToItem(nextItemId) : changePage(1);
  useHotkeys('ctrl+shift+arrowLeft', goPreviousFunc, {enabled: hasLess, enableOnContentEditable: true},
    [history, isOnWorkItem, previousItemId, messagesState, page]);
  useHotkeys('ctrl+shift+arrowRight', goNextFunc, {enabled: hasMore, enableOnContentEditable: true},
    [history, isOnWorkItem, nextItemId, messagesState, page]);
  const hasCheckAbleInboxItems = !_.isEmpty(data.filter((message) =>
    message.type_object_id?.startsWith('UNREAD')))
  return (
    <>
    <div style={{zIndex: 8, position: 'sticky', width: '100%', marginLeft: isOnWorkItem ? undefined : '-0.5rem'}}
      id="inbox-header">
      {!isOnWorkItem && (
        <GmailTabs
          value={tabIndex}
          onChange={(event, value) => {
            window.scrollTo(0, 0);
            inboxDispatch(setTab(value));
          }}
          removeBoxShadow
          indicatorColors={[htmlColor, '#00008B']}
          style={{ paddingBottom: '0.5rem', paddingTop: '1rem', marginTop: '-1rem' }}>
          <GmailTabItem icon={<InboxIcon htmlColor={htmlColor} />} label={intl.formatMessage({id: 'unread'})}
                        color='black' tagLabel={unreadCount > 0 ? intl.formatMessage({id: 'new'}) : undefined}
                        tagColor={unreadCount > 0 ? '#E85757' : undefined} toolTipId='forYouToolTip'
                        tag={unreadCount > 0 ? `${unreadCount}` :
                          (_.size(inboxMessagesOrdered) > 0 ? `${_.size(inboxMessagesOrdered)}` : undefined)} />
          <GmailTabItem icon={<OutboxIcon />} label={intl.formatMessage({id: 'outbox'})}
                        toolTipId='fromYouToolTip'
                        tag={_.size(outBoxMessagesOrdered) > 0 ? `${_.size(outBoxMessagesOrdered)}` : undefined} />
        </GmailTabs>
      )}
      <div style={{paddingBottom: tabIndex > 0 ? '0.25rem' : undefined, backgroundColor: 'white'}}>
        <div style={{display: 'flex', width: '80%', marginBottom: mobileLayout && workItemId ? '1rem': undefined}}>
          {!mobileLayout && !isOnWorkItem && (
            <Checkbox style={{padding: 0, marginLeft: '0.6rem'}}
                      checked={0 === tabIndex ? checkAll : checkAllOutbox}
                      disabled={tabIndex === 0 ? !hasCheckAbleInboxItems : _.isEmpty(outBoxMessagesOrdered)}
                      indeterminate={0 === tabIndex ? indeterminate : indeterminateOutbox}
                      onChange={() => 0 === tabIndex ? determinateDispatch({type: 'toggle'}) :
                        determinateDispatchOutbox({type: 'toggle'})}
            />
          )}
          {(checkAll || !_.isEmpty(determinate)) && 0 === tabIndex && !isOnWorkItem && (
            <TooltipIconButton
              icon={<NotificationDeletion />}
              onClick={() => {
                // UNREAD are the only ones that can be selected
                let toProcess = messagesFull.filter((message) => message.type_object_id.startsWith('UNREAD'));
                if (checkAll) {
                  if (!_.isEmpty(determinate)) {
                    const keys = Object.keys(determinate);
                    toProcess = toProcess.filter((message) => !keys.includes(message.type_object_id));
                  }
                } else {
                  const keys = Object.keys(determinate);
                  toProcess = toProcess.filter((message) => keys.includes(message.type_object_id));
                }
                return deleteOrDehilightMessages(toProcess, messagesDispatch)
                  .then(() => {
                    determinateDispatch({type: 'clear'});
                  }).finally(() => {
                    setOperationRunning(false);
                  });
              }} translationId="inboxArchive" />
          )}
          {(checkAllOutbox || !_.isEmpty(determinateOutbox)) && 1 === tabIndex && !isOnWorkItem && (
            <TooltipIconButton
              icon={<NotificationsActive />}
              onClick={() => {
                let toProcess = outBoxMessagesOrdered;
                if (checkAll) {
                  if (!_.isEmpty(determinateOutbox)) {
                    const keys = Object.keys(determinateOutbox);
                    toProcess = messagesFull.filter((message) => !keys.includes(message.id));
                  }
                } else {
                  const keys = Object.keys(determinateOutbox);
                  toProcess = messagesFull.filter((message) => keys.includes(message.id));
                }
                let promiseChain = Promise.resolve(true);
                if (!_.isEmpty(toProcess)) {
                  toProcess.forEach((message) => {
                    // getMarketClient will cache so only way to improve performance here would be poke takes list
                    promiseChain = promiseChain.then(() => getMarketClient(message.marketId).then((client) => {
                        if (message.isInvestibleType) {
                          return client.users.pokeInvestible(message.id);
                        }
                        return client.users.pokeComment(message.id);
                      }));
                  });
                }
                return promiseChain.then(() => {
                    determinateDispatchOutbox({type: 'clear'});
                  }).finally(() => {
                    setOperationRunning(false);
                  });
              }} translationId="outboxMark" />
          )}
          {isOnWorkItem && (
            <TooltipIconButton icon={<ArrowBack style={{marginLeft: '0.5rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                               onClick={() => {
                                 navigate(history, getInboxTarget());
                               }} translationId="backToInbox" />
          )}
          <div style={{flexGrow: 1}}/>
          <Box fontSize={14} color="text.secondary">
            {isOnWorkItem && current && (
              `${current} of ${_.size(unpaginatedItems) > 0 ? _.size(unpaginatedItems) : 1}`
            )}
            {!isOnWorkItem && (
              `${first} - ${last} of ${_.size(unpaginatedItems) > 0 ? _.size(unpaginatedItems) : 1}`
            )}
            <TooltipIconButton disabled={!hasLess} icon={<KeyboardArrowLeft
              htmlColor={hasLess ? ACTION_BUTTON_COLOR : 'disabled'} />}
                               onClick={goPreviousFunc} translationId="previousInbox" />
            <TooltipIconButton disabled={!hasMore} icon={<KeyboardArrowRight
              htmlColor={hasMore ? ACTION_BUTTON_COLOR : 'disabled'} />}
                               onClick={goNextFunc} translationId="nextInbox" />
          </Box>
        </div>
      </div>
    </div>
    <div id="inbox">
      {!mobileLayout && defaultRow}
      {mobileLayout && <div style={{paddingLeft: '1rem'}}>{defaultRow}</div>}
      { getRows(tabIndex === 0) }
    </div>
    </>
  );
}

Inbox.propTypes = {
  inboxState: PropTypes.object,
  inboxDispatch: PropTypes.func,
  messagesHash: PropTypes.object,
  searchResults: PropTypes.object
}

Inbox.defaultProps = {
  inboxState: {},
  inboxDispatch: () => {},
  messagesHash: {},
  searchResults: {}
};

export default Inbox;