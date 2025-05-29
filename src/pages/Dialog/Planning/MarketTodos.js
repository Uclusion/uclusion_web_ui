import React, { useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Box, Checkbox, IconButton, Link, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import _ from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router';
import { darken, makeStyles } from '@material-ui/core/styles';
import { yellow } from '@material-ui/core/colors';
import Comment from '../../../components/Comments/Comment';
import { TODO_TYPE } from '../../../constants/comments';
import { updateComment } from '../../../api/comments';
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import {
  formMarketAddCommentLink,
  formMarketAddInvestibleLink, MARKET_TODOS_HASH,
  navigate,
  removeHash
} from '../../../utils/marketIdPathFunctions';
import Chip from '@material-ui/core/Chip';
import {
  findMessageForCommentId,
  getPaginatedItems,
  getRealPage,
  getUnreadCount,
  removeMessagesForCommentId
} from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getThreadIds } from '../../../utils/commentFunctions';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import DismissableText from '../../../components/Notifications/DismissableText';
import { deleteOrDehilightMessages } from '../../../api/users';
import { stripHTML } from '../../../utils/stringFunctions';
import { BLUE_LEVEL, RED_LEVEL, UNASSIGNED_TYPE, YELLOW_LEVEL } from '../../../constants/notifications';
import { BUG_WIZARD_TYPE } from '../../../constants/markets';
import BugListItem from '../../../components/Comments/BugListItem';
import getReducer, {
  contractAll,
  expandAll,
  PAGE_SIZE,
  pin,
  setPage,
  setTab
} from '../../../components/Comments/BugListContext';
import { getDeterminateReducer } from '../../../contexts/ContextUtils';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import { Eject, ExpandLess, KeyboardArrowLeft } from '@material-ui/icons';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { getNewBugNotifications } from '../../../components/Comments/Options';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import AddIcon from '@material-ui/icons/Add';
import {
  DEHIGHLIGHT_EVENT,
  DELETE_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages';
import { pushMessage } from '../../../utils/MessageBusUtils';
import { dehighlightCriticalMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer';
import EditIcon from '@material-ui/icons/Edit';
import { hasBug } from '../../../components/AddNewWizards/Bug/BugDescriptionStep';
import { useHotkeys } from 'react-hotkeys-hook';

export const todoClasses = makeStyles(
  theme => {
    return {
      outlined: {
        cursor: 'grab',
        outline: `1px solid ${theme.palette.grey['400']}`,
        outlineOffset: '-5px',
        borderRadius: 16
      },
      outlinedSelected: {
        backgroundColor: theme.palette.grey['200'],
        outline: `1px solid ${theme.palette.grey['400']}`,
        outlineOffset: '-5px',
        borderRadius: 16
      },
      warnCard: {
        backgroundColor: yellow['100'],
        padding: theme.spacing(1, 0, 0, 2),
        overflowY: 'auto',
        overflowX: 'hidden',
        maxHeight: '275px'
      },
      card: {
        padding: theme.spacing(1, 0, 0, 2),
        overflowY: 'auto',
        overflowX: 'hidden',
        maxHeight: '275px'
      },
      cardSelected: {
        backgroundColor: theme.palette.grey['200'],
        padding: theme.spacing(1, 0, 0, 2),
        maxHeight: '275px'
      },
      raisedCardSelected: {
        backgroundColor: theme.palette.grey['200'],
      },
      warnHighlightedCard: {
        backgroundColor: yellow['100'],
      },
      white: {
        backgroundColor: 'white',
        padding: 0,
        margin: 0,
        overflowY: 'auto',
        maxHeight: '25rem'
      },
      containerGreen: {
        borderColor: 'green',
        borderStyle: 'dashed',
        borderWidth: '3px',
        borderRadius: 6
      },
      outerBorder: {
        marginBottom: '30px'
      },
      chipStyleWhite: {
        backgroundColor: 'white',
        border: '0.5px solid grey'
      },
      chipStyleRed: {
        padding: '4px',
        backgroundColor: '#E85757'
      },
      chipStyleYellow: {
        padding: '4px',
        backgroundColor: '#e6e969'
      },
      chipStyleBlue: {
        padding: '4px',
        backgroundColor: '#2F80ED'
      },
      grow: {
        padding: '30px',
        flexGrow: 1,
        backgroundColor: 'white',
      },
      containerEmpty: {},
      containerHidden: {
        display: 'none'
      },
      actionSecondary: {
        backgroundColor: "#2d9cdb",
        color: "white",
        textTransform: 'none',
        fontWeight: '700',
        marginRight: '1rem',
        "&:hover": {
          backgroundColor: darken("#2d9cdb", 0.04)
        },
        "&:focus": {
          backgroundColor: darken("#2d9cdb", 0.12)
        }
      },
    };
  },
  { name: 'Archive' }
);

function MarketTodos(props) {
  const {
    comments,
    marketId,
    groupId,
    isInArchives = false,
    sectionOpen, setSectionOpen,
    hidden,
    isInbox=false,
    openDefaultId,
    message
  } = props
  const classes = todoClasses();
  const wizardClasses = wizardStyles();
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const location = useLocation();
  const { hash } = location;
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const useOpenDefaultId = message?.is_highlighted ? openDefaultId : undefined;
  const reducerInitState = {page: 1, tabIndex: 0,
    expansionState: useOpenDefaultId ? {[useOpenDefaultId]: true} : {}, pageState: {}, defaultPage: 1};
  const [bugState, bugDispatch] = useReducer(getReducer(), reducerInitState);
  const [determinateState, determinateDispatch] = useReducer(getDeterminateReducer(),
    {determinate: {}, indeterminate: false, checkAll: false});
  const { indeterminate, determinate, checkAll } = determinateState;
  const { tabIndex, page: originalPage, expansionState, pinned } = bugState;
  const { results, parentResults, search } = searchResults;
  const todoComments = comments.filter(comment => {
    if (_.isEmpty(search)) {
      return comment.comment_type === TODO_TYPE;
    }
    return comment.comment_type === TODO_TYPE && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  }) || [];
  const blueComments = todoComments.filter((comment) => comment.notification_type === BLUE_LEVEL);
  const yellowComments = todoComments.filter((comment) => comment.notification_type === YELLOW_LEVEL);
  const redComments = todoComments.filter((comment) => comment.notification_type === RED_LEVEL);
  const tabCommentsRaw = tabIndex === 0 ? redComments : (tabIndex === 1 ? yellowComments : blueComments);
  const unreadRedCount = getUnreadCount(redComments, messagesState);
  const unreadYellowCount = getUnreadCount(yellowComments, messagesState);
  const unreadBlueCount = getUnreadCount(blueComments, messagesState);
  const tabComments = _.orderBy(tabCommentsRaw, ['updated_at'], ['desc']);
  const page = getRealPage(tabComments, pinned, originalPage, PAGE_SIZE);
  const { first, last, data, hasMore, hasLess } = getPaginatedItems(tabComments, page,
    PAGE_SIZE);

  useHotkeys('ctrl+a', () => navigate(history,
      formMarketAddCommentLink(BUG_WIZARD_TYPE, marketId, groupId, tabIndex)),
    {enabled: !hidden && sectionOpen},
    [history, groupId, marketId, tabIndex]);

  useEffect(() => {
    if (hash && !hidden && !isInbox) {
      const todoParents = comments.filter(comment => comment.comment_type === TODO_TYPE &&
        !comment.investible_id && !comment.resolved) || [];
      const todoCommentIds = getThreadIds(todoParents, comments);
      const foundCommentId = todoCommentIds.find((anId) => hash.includes(anId));
      if (foundCommentId) {
        const foundComment = comments.find((comment) => comment.id === foundCommentId);
        const { root_comment_id: rootId } = foundComment;
        const rootComment = !rootId ? foundComment : comments.find((comment) => comment.id === rootId);
        const { notification_type: notificationType } = rootComment;
        if (notificationType === RED_LEVEL) {
          bugDispatch(setTab(0));
        } else if (notificationType === YELLOW_LEVEL) {
          bugDispatch(setTab(1));
        } else {
          bugDispatch(setTab(2));
        }
        bugDispatch(pin(rootComment.id));
        const message = findMessageForCommentId(rootComment.id, messagesState);
        if (message?.is_highlighted) {
          let event = DEHIGHLIGHT_EVENT;
          if (message.type_object_id.startsWith('UNREAD')) {
            event = DELETE_EVENT;
          }
          pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event, message: message.type_object_id });
        }
        removeHash(history);
      }
      if (foundCommentId || hash.includes(MARKET_TODOS_HASH)) {
        if (!sectionOpen) {
          setSectionOpen();
        }
        if (hash.includes(MARKET_TODOS_HASH)) {
          removeHash(history);
        }
      }
    }
    return () => {};
  }, [comments, hash, hidden, history, messagesState, sectionOpen, setSectionOpen, isInbox]);

  useEffect(() => {
    if (openDefaultId && message?.type === UNASSIGNED_TYPE) {
      messagesDispatch(dehighlightCriticalMessage(message.type_object_id,
        `${message.type}_${openDefaultId}`));
    }
  }, [message?.type, message?.type_object_id, messagesDispatch, openDefaultId]);

  function processTabNotifications() {
    const allMessages = [];
    data.forEach((comment) => {
      const replies = comments.filter(comment => comment.root_comment_id === comment.id) || [];
      const myMessage = findMessageForCommentId(comment.id, messagesState);
      if (myMessage) {
        allMessages.push(myMessage);
      }
      replies.forEach((reply) => {
        const aMessage = findMessageForCommentId(reply.id, messagesState);
        if (aMessage) {
          allMessages.push(aMessage);
        }
      })
    })
    if (_.isEmpty(allMessages)) {
      setOperationRunning(false);
      return;
    }
    return deleteOrDehilightMessages(allMessages, messagesDispatch,true)
      .then(() => setOperationRunning(false))
      .finally(() => {
        setOperationRunning(false);
      });
  }

  function getRows() {
    if (_.isEmpty(data)) {
      return <div className={classes.grow} key={`todos${tabIndex}empty`}/>
    }
    const numOpen = _.size(data.filter((comment) => !!expansionState[comment.id]));
    return data.map((comment) => {
      const { id, body, updated_at: updatedAt, notification_type: notificationType } = comment;
      const replies = comments.filter(comment => comment.root_comment_id === id) || [];
      const expansionPanel = <div id={`c${id}`} key={`c${id}key`} style={{marginBottom: '1rem'}}>
        <Comment
          marketId={marketId}
          comment={comment}
          comments={comments}
          allowedTypes={[TODO_TYPE]}
          noAuthor
          isInbox={isInbox}
          inboxMessageId={id}
          focusMove={numOpen === 1}
        />
      </div>
      const determinateChecked = determinate[id];
      const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
      return (
        <BugListItem id={id} key={id} replyNum={replies.length + 1} title={stripHTML(body)}
                     newMessages={getNewBugNotifications(comment, messagesState)}
                     date={intl.formatDate(updatedAt)} marketId={marketId}
                     useSelect={!isInArchives} expansionPanel={expansionPanel} checked={checked}
                     expansionOpen={!!expansionState[id]} determinateDispatch={determinateDispatch}
                     bugListDispatch={bugDispatch} notificationType={notificationType} />
      );
    });
  }

  function onDrop(event, notificationType) {
    const commentId = event.dataTransfer.getData('text');
    const currentNotificationType = event.dataTransfer.getData("notificationType");
    if (currentNotificationType === notificationType) {
      return Promise.resolve(false);
    }
    setOperationRunning(true);
    removeMessagesForCommentId(commentId, messagesState);
    const target = event.target;
    target.style.cursor = 'wait';
    return updateComment({marketId, commentId, notificationType})
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        setOperationRunning(false);
        return comment;
      }).finally(() => {
      target.style.cursor = 'pointer';
      setOperationRunning(false);
    });
  }

  function onDropImmediate(event) {
    onDrop(event, 'RED');
  }

  function onDropAble(event) {
    onDrop(event, 'YELLOW');
  }

  function onDropConvenient(event) {
    onDrop(event, 'BLUE');
  }

  function changePage(byNum) {
    bugDispatch(setPage(page + byNum));
  }

  function moveSelected() {
    const selected = Object.keys(determinate).filter((key) => determinate[key]);
    const checked = checkAll ? data.filter((comment) => determinate[comment.id] !== false)
        .map((comment) => comment.id) : selected;
    let checkedString;
    if (!_.isEmpty(checked)) {
      checked.forEach((anId) => {
        if (checkedString) {
          checkedString += `&fromCommentId=${anId}`;
        } else {
          checkedString = `&fromCommentId=${anId}`;
        }
      });
      determinateDispatch({type: 'clear'});
      if (checkedString) {
        if (message) {
          navigate(history, `${formMarketAddInvestibleLink(marketId, groupId, undefined, 
            message.type_object_id)}${checkedString}`);
        } else {
          navigate(history, `${formMarketAddInvestibleLink(marketId, groupId)}${checkedString}`);
        }
      }
    }
  }

  const immediateTodosChip = <Chip color="primary" size='small' className={classes.chipStyleRed} />;
  const yellowChip = <Chip color="primary" size='small' className={classes.chipStyleYellow} />;
  const blueChip = <Chip color="primary" size='small' className={classes.chipStyleBlue} />;

  function doExpandAll(){
    bugDispatch(expandAll(data));
    processTabNotifications();
  }

  useHotkeys('ctrl+alt+e', doExpandAll, {enableOnContentEditable: true}, [data, expansionState]);
  useHotkeys('ctrl+shift+e', ()=> bugDispatch(contractAll(data)),
    {enableOnContentEditable: true}, [data, expansionState]);

  return (
    <div id="marketTodos" key="marketTodosKey" style={{display: sectionOpen ? 'block' : 'none',
      overflowX: 'hidden', paddingBottom: !(isInbox || isInArchives) ? '5rem' : undefined}}>
      {!isInArchives && !isInbox && (
        <SpinningButton id="newMarketTodo"
                        className={wizardClasses.actionNext}
                        style={{marginBottom: '1rem', marginTop: '1rem'}}
                        variant="text" doSpin={false}
                        icon={hasBug(groupId) ? EditIcon : AddIcon} iconColor="black" toolTipId='hotKeyTODO'
                        onClick={() => navigate(history,
                          formMarketAddCommentLink(BUG_WIZARD_TYPE, marketId, groupId, tabIndex))}>
          <FormattedMessage id='createBug'/>
        </SpinningButton>
      )}
      <DismissableText textId="todosHelp" noPad display={!isInArchives && _.isEmpty(search) && _.isEmpty(todoComments)}
                       text={
        <div>
          Use "Add bug" above to create a <Link href="https://documentation.uclusion.com/views/bugs" target="_blank">bug</Link> that
          sends notifications based on severity.
        </div>
      }/>
      {!isInbox && (
        <GmailTabs
          value={tabIndex}
          onChange={(event, value) => {
            bugDispatch(setTab(value));
          }}
          indicatorColors={['#E85757', '#e6e969', '#2F80ED']}
          style={{ paddingBottom: '1rem', paddingTop: '1rem' }}>
          <GmailTabItem icon={immediateTodosChip} label={intl.formatMessage({id: 'immediate'})}
                        color='black' tagLabel={unreadRedCount > 0 ? intl.formatMessage({id: 'new'}) : undefined}
                        tagColor={unreadRedCount > 0 ? '#E85757' : undefined}
                        tag={unreadRedCount > 0 ? `${unreadRedCount}` :
                          (_.size(redComments) > 0 ? `${_.size(redComments)}` : undefined)}
                        onDrop={onDropImmediate} toolTipId='immediateToolTip'
                        onDragOver={(event)=>event.preventDefault()}/>
          <GmailTabItem icon={yellowChip} label={intl.formatMessage({id: 'able'})}
                        color='black' tagColor={unreadYellowCount > 0 ? '#E85757' : undefined}
                        tagLabel={unreadYellowCount > 0 ? intl.formatMessage({id: 'new'}) : undefined}
                        tag={unreadYellowCount > 0 ? `${unreadYellowCount}` :
                          (_.size(yellowComments) > 0 ? `${_.size(yellowComments)}` : undefined)}
                        onDrop={onDropAble} toolTipId='normalToolTip'
                        onDragOver={(event)=>event.preventDefault()} />
          <GmailTabItem icon={blueChip} label={intl.formatMessage({id: 'convenient'})}
                        color='black' tagColor={unreadBlueCount > 0 ? '#E85757' : undefined}
                        tagLabel={unreadBlueCount > 0 ? intl.formatMessage({id: 'new'}) : undefined}
                        tag={unreadBlueCount > 0 ? `${unreadBlueCount}` :
                          (_.size(blueComments) > 0 ? `${_.size(blueComments)}` : undefined)}
                        onDrop={onDropConvenient} toolTipId='minorToolTip'
                        onDragOver={(event)=>event.preventDefault()} />
        </GmailTabs>
      )}
      {!_.isEmpty(tabComments) && (
        <div key="todoComments" style={{paddingBottom: '0.25rem', backgroundColor: 'white'}}>
          <div style={{display: 'flex', width: '80%'}}>
            {!mobileLayout && !isInArchives && (
              <Checkbox style={{padding: 0, marginLeft: '0.6rem'}}
                        checked={checkAll}
                        indeterminate={indeterminate}
                        onChange={() => determinateDispatch({type: 'toggle'})}
              />
            )}
            {(checkAll || !_.isEmpty(determinate)) && (
              <TooltipIconButton
                icon={<Eject htmlColor={ACTION_BUTTON_COLOR} />}
                onClick={moveSelected} translationId="todosCreateStory" />
            )}
            <TooltipIconButton icon={<ExpandLess style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                               onClick={() => {
                                 bugDispatch(contractAll(data));
                               }} translationId="inboxCollapseAll" />
            <TooltipIconButton icon={<ExpandMoreIcon style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                               onClick={doExpandAll} translationId="inboxExpandAll" />
            <div style={{flexGrow: 1}}/>
            <Box fontSize={14} color="text.secondary">
              {first} - {last} of {_.size(tabComments)}
              <IconButton disabled={!hasLess} onClick={() => changePage(-1)} >
                <KeyboardArrowLeft />
              </IconButton>
              <IconButton disabled={!hasMore} onClick={() => changePage(1)}>
                <KeyboardArrowRight />
              </IconButton>
            </Box>
          </div>
        </div>
      )}
      {_.isEmpty(data) && tabIndex === 0 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'immediate'})} is empty.<br/><br/>
          Bugs that urgently need assignment display here.
        </Typography>
      )}
      {_.isEmpty(data) && tabIndex === 1 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'able'})} is empty.<br/><br/>
          Bugs that need assignment display here.
        </Typography>
      )}
      {_.isEmpty(data) && tabIndex === 2 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'convenient'})} is empty.<br/><br/>
          Bugs that can wait till other work is done display here.
        </Typography>
      )}
      {getRows()}
    </div>
  )
}

MarketTodos.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
};

MarketTodos.defaultProps = {
  comments: [],
};

export default MarketTodos;
