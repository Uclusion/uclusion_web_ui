import React, { useContext, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, IconButton, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import _ from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import Comment from '../../../components/Comments/Comment';
import { TODO_TYPE } from '../../../constants/comments';
import { alterComments, reopenComment, resolveComment } from '../../../api/comments';
import { addCommentToMarket, addMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { removeMessagesForCommentId } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { stripHTML } from '../../../utils/stringFunctions';
import BugListItem from '../../../components/Comments/BugListItem';
import getReducer, { contractAll, expandAll } from '../../../components/Comments/BugListContext';
import { getDeterminateReducer } from '../../../contexts/ContextUtils';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import { BugReport, Eject, ExpandLess } from '@material-ui/icons';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants';
import { getNewBugNotifications } from '../../../components/Comments/Options';
import { todoClasses } from '../../Dialog/Planning/MarketTodos';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { sortInProgress } from '../../../containers/CommentBox/CommentBox';
import { useHotkeys } from 'react-hotkeys-hook';
import { BLUE_LEVEL, YELLOW_LEVEL } from '../../../constants/notifications';

function CondensedTodos(props) {
  const {
    comments,
    investibleComments,
    marketInfo,
    marketId,
    groupId,
    isInbox = false,
    hideTabs,
    usePadding = true,
    isDefaultOpen = false,
    defaultToOpenComments = true,
    removeActions = true,
    useColor = false,
    expandTasksNotSection=false,
    sectionTitle
  } = props
  const classes = todoClasses();
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState] = useContext(NotificationsContext);
  const [showOpen, setShowOpen] = useState(defaultToOpenComments);
  const [sectionOpen, setSectionOpen] = useState(expandTasksNotSection || isDefaultOpen);
  const [tasksOpen, setTasksOpen] = useState(isDefaultOpen);
  const [todoState, todoDispatch] = useReducer(getReducer(), {expansionState: {}});
  const [determinateState, determinateDispatch] = useReducer(getDeterminateReducer(),
    {determinate: {}, indeterminate: false, checkAll: false});
  const { indeterminate, determinate, checkAll } = determinateState;
  const { expansionState } = todoState;
  const openComments = comments.filter((comment) => !comment.resolved);
  const resolvedComments = comments.filter((comment) => comment.resolved);
  const tabCommentsRaw = showOpen ? openComments : resolvedComments;
  const tabComments = sortInProgress(_.orderBy(tabCommentsRaw, ['updated_at', 'body'], ['desc', 'asc']));

  function getRows() {
    if (!sectionOpen) {
      return <div style={{marginBottom: '1rem'}} key={`${showOpen}empty`}/>
    }
    return tabComments.map((comment) => {
      const { id, body, updated_at: updatedAt } = comment;
      const replies = comments.filter(comment => comment.root_comment_id === id) || [];
      const expansionPanel = <div id={`condensed${id}`}
                                  style={{marginBottom: '1rem', marginRight: '1rem', marginLeft: '1rem'}}>
        <Comment
          marketId={marketId}
          comment={comment}
          comments={investibleComments}
          allowedTypes={[TODO_TYPE]}
          marketInfo={marketInfo}
          noAuthor
          isInbox={isInbox}
          removeActions={isInbox && removeActions}
          stagePreventsActions={isInbox && removeActions}
          idPrepend='condensed'
        />
      </div>
      const determinateChecked = determinate[id];
      const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
      return (
        <BugListItem id={id} replyNum={replies.length + 1} title={stripHTML(body)} useMinWidth={false}
                     newMessages={isInbox ? undefined : getNewBugNotifications(comment, messagesState)}
                     date={intl.formatDate(updatedAt)}
                     useSelect={!isInbox} expansionPanel={expansionPanel} checked={checked}
                     expansionOpen={!!expansionState[id]} 
                     determinateDispatch={determinateDispatch}
                     bugListDispatch={todoDispatch} notificationType="todo" />
      );
    });
  }

  function onDrop(event, isOpen) {
    const commentId = event.dataTransfer.getData('text');
    setOperationRunning(true);
    removeMessagesForCommentId(commentId, messagesState);
    const target = event.target;
    target.style.cursor = 'wait';
    return isOpen ? resolveComment(marketId, commentId) : reopenComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        setOperationRunning(false);
        return comment;
      }).finally(() => {
      target.style.cursor = 'pointer';
      setOperationRunning(false);
    });
  }

  function onDropOpen(event) {
    onDrop(event, true);
  }

  function onDropResolved(event) {
    onDrop(event, false);
  }

  function moveToBugs(bugType) {
    const selected = Object.keys(determinate).filter((key) => determinate[key]);
    const checked = checkAll ? tabComments.filter((comment) => determinate[comment.id] !== false)
      .map((comment) => comment.id) : selected;
    setOperationRunning(true);
    if (!_.isEmpty(checked)) {
      return alterComments(marketId, checked, bugType).then((comments) => {
        determinateDispatch({type: 'clear'});
        addMarketComments(commentDispatch, marketId, comments);
        setOperationRunning(false);
      });
    }
  }

  function moveSelected() {
    const selected = Object.keys(determinate).filter((key) => determinate[key]);
    const checked = checkAll ? tabComments.filter((comment) => determinate[comment.id] !== false)
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
        navigate(history, `${formMarketAddInvestibleLink(marketId, groupId)}${checkedString}`);
      }
    }
  }

  function toggleTodos() {
    if (expandTasksNotSection) {
      if (tasksOpen) {
        todoDispatch(contractAll(tabComments));
      } else {
        todoDispatch(expandAll(tabComments));
      }
      setTasksOpen(!tasksOpen);
    } else {
      setSectionOpen(!sectionOpen);
    }
  }

  const myToggleTodosOpen = expandTasksNotSection ? tasksOpen : sectionOpen;
  useHotkeys('ctrl+alt+e', ()=> {
    if (expandTasksNotSection) {
      todoDispatch(expandAll(tabComments));
      setTasksOpen(true);
    } else {
      setSectionOpen(true);
    }
  }, {enableOnContentEditable: true}, []);
  useHotkeys('ctrl+shift+e', ()=> {
    if (expandTasksNotSection) {
      todoDispatch(contractAll(tabComments));
      setTasksOpen(false);
    } else {
      setSectionOpen(false);
    }
  }, {enableOnContentEditable: true}, []);

  return (
    <div className={sectionOpen ? classes.outerBorder : undefined} id="investibleCondensedTodos"
         style={{marginLeft: usePadding ? '1rem' : undefined}}>
      <div style={{display: 'flex', alignItems: 'center', marginTop: isInbox ? '1rem' : undefined}}>
        <h2 id="tasksOverview" style={{paddingBottom: 0, marginBottom: 0, marginTop: 0, paddingTop: 0}}>
          <FormattedMessage id={!_.isEmpty(sectionTitle) ? sectionTitle : 'taskSection'} />
        </h2>
        <IconButton onClick={toggleTodos} style={{marginBottom: 0,
          paddingBottom: 0, marginTop: 0, paddingTop: 0}}>
          <Tooltip key='toggleTodos'
                   title={<FormattedMessage id={`${myToggleTodosOpen ? 'closeTodos' : 'openTodos'}Tip`} />}>
            {myToggleTodosOpen ?
              <ExpandLess fontSize='large' htmlColor='black' /> :
            <ExpandMoreIcon fontSize='large' htmlColor='black' />}
          </Tooltip>
        </IconButton>
      </div>
      {!hideTabs && sectionOpen && (
        <GmailTabs
          removeBoxShadow
          useColor={useColor}
          value={showOpen ? 0 : 1}
          onChange={(event, value) => {
            setShowOpen(value === 0);
          }}
          indicatorColors={['black', 'black']}
          style={{ paddingBottom: '1rem' }}>
          <GmailTabItem label={intl.formatMessage({id: 'openHeader'})}
                        color='black' tagLabel={intl.formatMessage({id: 'total'})}
                        tag={`${_.size(openComments)}`}
                        onDrop={onDropOpen} toolTipId='openTasksToolTip'
                        onDragOver={(event)=>event.preventDefault()}/>
          <GmailTabItem label={intl.formatMessage({id: 'closedComments'})}
                        color='black'
                        tagLabel={intl.formatMessage({id: 'total'})}
                        tag={`${_.size(resolvedComments)}`}
                        onDrop={onDropResolved} toolTipId='resolvedTasksToolTip'
                        onDragOver={(event)=>event.preventDefault()} />
        </GmailTabs>
      )}
      {!_.isEmpty(tabComments) && sectionOpen && (
        <div style={{paddingBottom: '0.25rem'}}>
          <div style={{display: 'flex', width: '80%'}}>
            {!mobileLayout && !isInbox && (
              <Checkbox style={{padding: 0, marginLeft: '0.6rem'}}
                        checked={checkAll}
                        indeterminate={indeterminate}
                        onChange={() => determinateDispatch({type: 'toggle'})}
              />
            )}
            {(checkAll || !_.isEmpty(determinate)) && (
              <TooltipIconButton
                icon={<Eject htmlColor={ACTION_BUTTON_COLOR} />}
                onClick={moveSelected} translationId="todosMove" />
            )}
            {(checkAll || !_.isEmpty(determinate)) && !isInbox && (
              <TooltipIconButton
                icon={<BugReport htmlColor='#e6e969' />}
                onClick={() => moveToBugs(YELLOW_LEVEL)} translationId="moveTodoYellow" />
            )}
            {(checkAll || !_.isEmpty(determinate)) && !isInbox && (
              <TooltipIconButton
                icon={<BugReport htmlColor='#2F80ED' />}
                onClick={() => moveToBugs(BLUE_LEVEL)} translationId="moveTodoBlue" />
            )}
          </div>
        </div>
      )}
      {_.isEmpty(tabComments) && showOpen && sectionOpen && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          No open tasks.
        </Typography>
      )}
      {_.isEmpty(tabComments) && !showOpen && sectionOpen && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          No resolved tasks.
        </Typography>
      )}
      {getRows()}
    </div>
  )
}

CondensedTodos.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  hideTabs: PropTypes.bool
};

CondensedTodos.defaultProps = {
  comments: [],
  hideTabs: false
};

export default CondensedTodos;
