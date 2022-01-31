import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Checkbox, Grid, Typography, useMediaQuery, useTheme, Link } from '@material-ui/core'
import _ from 'lodash'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { FormattedMessage, useIntl } from 'react-intl'
import { useHistory, useLocation } from 'react-router'
import { darken, makeStyles } from '@material-ui/core/styles'
import { yellow } from '@material-ui/core/colors'
import {
  SECTION_SUB_HEADER,
  SECTION_TYPE_SECONDARY_WARNING,
  SECTION_TYPE_TERTIARY_WARNING, SECTION_TYPE_WARNING
} from '../../../constants/global'
import SubSection from '../../../containers/SubSection/SubSection'
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor'
import Comment from '../../../components/Comments/Comment'
import { TODO_TYPE } from '../../../constants/comments'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import CommentAdd from '../../../components/Comments/CommentAdd'
import { updateComment } from '../../../api/comments'
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import {
  formMarketAddInvestibleLink,
  formMarketArchivesLink,
  formMarketLink,
  navigate
} from '../../../utils/marketIdPathFunctions'
import Chip from '@material-ui/core/Chip'
import { removeHeader, restoreHeader } from '../../../containers/Header'
import { LocalPlanningDragContext } from './PlanningDialog'
import { findMessageForCommentId, removeMessagesForCommentId } from '../../../utils/messageUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { invalidEditEvent } from '../../../utils/windowUtils'
import MarketTodoMenu from './MarketTodoMenu'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined'
import { doRemoveEdit, doShowEdit } from './userUtils'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import { getThreadIds, notifyImmediate } from '../../../utils/commentFunctions'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import DismissableText from '../../../components/Notifications/DismissableText'
import { deleteOrDehilightMessages } from '../../../api/users'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { workListStyles } from '../../Home/YourWork/WorkListItem'

const myClasses = makeStyles(
  theme => {
    return {
      outlined: {
        cursor: 'grab',
        outline: `2px solid ${theme.palette.grey['400']}`,
        outlineOffset: '-5px'
      },
      warnCard: {
        backgroundColor: yellow['400'],
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
        marginRight: '5px',
        backgroundColor: '#E85757'
      },
      chipStyleYellow: {
        marginRight: '5px',
        color: 'black',
        backgroundColor: '#e6e969'
      },
      chipStyleBlue: {
        marginRight: '5px',
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

function MarketTodos (props) {
  const {
    comments,
    marketId, market, userId,
    isInArchives,
    sectionOpen, setSectionOpen
  } = props
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const workItemClasses = workListStyles();
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [beingDraggedHack, setBeingDraggedHack] = useContext(LocalPlanningDragContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const [showSelectTodos, setShowSelectTodos] = useState(false);
  const [checked, setChecked] = useState({});
  const todoComments = comments.filter(comment => {
    if (_.isEmpty(search)) {
      return comment.comment_type === TODO_TYPE;
    }
    return comment.comment_type === TODO_TYPE && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  }) || [];
  const blueComments = todoComments.filter((comment) => comment.notification_type === 'BLUE');
  const yellowComments = todoComments.filter((comment) => comment.notification_type === 'YELLOW');
  const redComments = todoComments.filter((comment) => comment.notification_type === 'RED');
  const location = useLocation();
  const { hash } = location;
  const [openMenuTodoId, setOpenMenuTodoId] = useState(undefined);
  const [anchorEl, setAnchorEl] = useState(null);
  const pageName = isInArchives ? 'archives' : '';
  const [commentAddRedStateFull, commentAddRedDispatch] = usePageStateReducer(`commentAddRed${pageName}`);
  const [commentAddRedState, updateCommentAddRedState, commentAddStateRedReset] =
    getPageReducerPage(commentAddRedStateFull, commentAddRedDispatch, marketId);
  const {
    createRedCard,
  } = commentAddRedState;
  const [commentRedStateFull, commentRedDispatch] = usePageStateReducer(`commentRed${pageName}`);
  const [commentRedState, updateCommentRedState, commentStateRedReset] =
    getPageReducerPage(commentRedStateFull, commentRedDispatch, marketId);
  const {
    cardEditing: editRedCardId,
  } = commentRedState;
  const [commentAddYellowStateFull, commentAddYellowDispatch] =
    usePageStateReducer(`commentAddYellow${pageName}`);
  const [commentAddYellowState, updateCommentAddYellowState, commentAddStateYellowReset] =
    getPageReducerPage(commentAddYellowStateFull, commentAddYellowDispatch, marketId);
  const {
    createYellowCard,
  } = commentAddYellowState;
  const [commentYellowStateFull, commentYellowDispatch] =
    usePageStateReducer(`commentYellow${pageName}`);
  const [commentYellowState, updateCommentYellowState, commentStateYellowReset] =
    getPageReducerPage(commentYellowStateFull, commentYellowDispatch, marketId);
  const {
    cardEditing: editYellowCardId,
  } = commentYellowState;
  const [commentAddBlueStateFull, commentAddBlueDispatch] =
    usePageStateReducer(`commentBlueAdd${pageName}`);
  const [commentAddBlueState, updateCommentAddBlueState, commentAddStateBlueReset] =
    getPageReducerPage(commentAddBlueStateFull, commentAddBlueDispatch, marketId);
  const {
    createCard,
  } = commentAddBlueState;
  const [commentBlueStateFull, commentBlueDispatch] =
    usePageStateReducer(`commentBlue${pageName}`);
  const [commentBlueState, updateCommentBlueState, commentStateBlueReset] =
    getPageReducerPage(commentBlueStateFull, commentBlueDispatch, marketId);
  const {
    cardEditing: editCardId,
  } = commentBlueState;

  function setOrRemoveCardOnReducer(aReducer, aReducerReset, comment) {
    if (comment) {
      aReducer({ cardEditing: comment.id });
    } else {
      aReducerReset();
    }
  }

  function setEditRedCard(comment) {
    setOrRemoveCardOnReducer(updateCommentRedState, commentStateRedReset, comment);
  }

  function setEditYellowCard(comment) {
    setOrRemoveCardOnReducer(updateCommentYellowState, commentStateYellowReset, comment);
  }

  function setEditCard(comment) {
    setOrRemoveCardOnReducer(updateCommentBlueState, commentStateBlueReset, comment);
  }

  useEffect(() => {
    function setEditRedCard(comment) {
      setOrRemoveCardOnReducer(updateCommentRedState, commentStateRedReset, comment);
    }

    function setEditYellowCard(comment) {
      setOrRemoveCardOnReducer(updateCommentYellowState, commentStateYellowReset, comment);
    }

    function setEditCard(comment) {
      setOrRemoveCardOnReducer(updateCommentBlueState, commentStateBlueReset, comment);
    }
    if (hash) {
      const todoParents = comments.filter(comment => comment.comment_type === TODO_TYPE &&
        !comment.investible_id && !comment.resolved) || [];
      const todoCommentIds = getThreadIds(todoParents, comments);
      const foundCommentId = todoCommentIds.find((anId) => hash.includes(anId));
      if (editRedCardId !== foundCommentId && editYellowCardId !== foundCommentId && editCardId !== foundCommentId ) {
        if (foundCommentId) {
          const foundComment = comments.find((comment) => comment.id === foundCommentId);
          const { root_comment_id: rootId } = foundComment;
          const rootComment = !rootId ? foundComment : comments.find((comment) => comment.id === rootId);
          const { notification_type: notificationType } = rootComment;
          if (notificationType === 'RED') {
            setEditRedCard(rootComment);
          } else if (notificationType === 'YELLOW') {
            setEditYellowCard(rootComment);
          } else {
            setEditCard(rootComment);
          }
        }
        if ((foundCommentId || hash.includes('Todos')) && !sectionOpen) {
          setSectionOpen('marketTodos');
        }
      }
    }
    return () => {};
  }, [commentStateBlueReset, commentStateRedReset, commentStateYellowReset, comments, editCardId, editRedCardId,
    editYellowCardId, hash, marketId, sectionOpen, setSectionOpen, updateCommentBlueState, updateCommentRedState,
    updateCommentYellowState]);

  function onDragStart(event, notificationType) {
    removeHeader();
    const commentId = event.target.id.substring(1);
    event.dataTransfer.setData('text', commentId);
    event.dataTransfer.setData('notificationType', notificationType);
    const previousClass = document.getElementById(`drag${commentId}`).className;
    setBeingDraggedHack({id:event.target.id, previousClass});
    document.getElementById(`drag${commentId}`).className = classes.containerEmpty;
  }

  function onDragEnd() {
    restoreHeader();
    const { previousElementId, previousClass, id } = beingDraggedHack;
    if (id) {
      const commentId = id.substring(1);
      if (editCardId === commentId) {
        setEditCard(undefined);
      }
      if (editRedCardId === commentId) {
        setEditRedCard(undefined);
      }
      if (editYellowCardId === commentId) {
        setEditYellowCard(undefined);
      }
      if (previousClass) {
        document.getElementById(`drag${commentId}`).className = previousClass;
      }
    }
    if (previousElementId) {
      document.getElementById(previousElementId).className = classes.containerEmpty;
      setBeingDraggedHack({});
    }
  }

  function todoSelectedToggle(id) {
    return () => {
      const { isChecked } = checked[id] || { isChecked: false };
      const newChecked = {
        ...checked,
        [id]: { isChecked: !isChecked },
      };
      setChecked(newChecked);
    };
  }

  function setOpenMenuCard(id, event) {
    if (openMenuTodoId === id) {
      setOpenMenuTodoId(undefined);
    } else {
      setAnchorEl(event.currentTarget);
      setOpenMenuTodoId(id);
    }
  }

  function getCards (commentsGetting, marketId, history, intl, setCard, sectionId) {
    function setCardAndScroll (comment) {
      setCard(comment)
      navigate(history,
        `${isInArchives ? formMarketArchivesLink(marketId) : formMarketLink(marketId)}#editc${comment.id}`)
    }

    if (_.isEmpty(commentsGetting)) {
      return <div className={classes.grow} key={`${sectionId}empty`}/>
    }
    const sortedData = _.sortBy(commentsGetting, 'updated_at').reverse()
    return sortedData.map((comment) => {
      const { id, body, updated_at, notification_type: notificationType } = comment;
      const replies = comments.filter(comment => comment.root_comment_id === id) || [];
      const myMessage = findMessageForCommentId(id, messagesState);
      const { is_highlighted: isHighlighted } = myMessage || {};
      const messages = isHighlighted ? [myMessage] : [];
      let useHighlight = isHighlighted;
      replies.forEach((reply) => {
        const aMessage = findMessageForCommentId(reply.id, messagesState);
        const { is_highlighted: isHighlighted } = aMessage || {};
        if (isHighlighted) {
          messages.push(aMessage);
          useHighlight = true;
        }
      })
      const { isChecked } = checked[id] || { isChecked: false };
      const showChip = replies.length > 0;
      return (
        <React.Fragment key={`${id}top`}>
          {openMenuTodoId === id && anchorEl && (
            <MarketTodoMenu comment={comment} editViewFunc={setCardAndScroll} market={market}
                            openIdFunc={setOpenMenuTodoId} anchorEl={anchorEl} />
          )}
          <Grid
            id={`c${id}`}
            key={`c${id}`}
            item
            md={3}
            xs={12}
            draggable={!operationRunning && !isInArchives}
            onDragStart={(event) => onDragStart(event, notificationType)}
            onDragEnd={onDragEnd}
            className={classes.outlined}
            onMouseOver={() => doShowEdit(id)} onMouseOut={() => doRemoveEdit(id)}
          >
            {showSelectTodos && (
              <Checkbox
                value={id}
                checked={isChecked}
                onChange={todoSelectedToggle(id)}
              />
            )}
            <RaisedCard elevation={0} onClick={(event) => {
              if (invalidEditEvent(event, history)) {
                return
              }
              if (isInArchives) {
                setCardAndScroll(comment)
              } else {
                setOpenMenuCard(id, event)
              }
            }}>
              <Grid container id={`drag${id}`} key={`drag${id}`}
                    className={useHighlight ? classes.warnCard : classes.card}>
                <Grid item xs={11} style={{ pointerEvents: 'none' }} key={`wComment${id}`}>
                  <div style={{ display: 'flex' }}>
                    <Typography style={{ fontSize: '.75rem', flex: 1 }}>
                      Updated: {intl.formatDate(updated_at)}
                    </Typography>
                    {showChip && (
                      <div style={{ display: 'flex', paddingBottom: '0.4rem' }}>
                        <Typography style={{ fontSize: '.75rem' }}>Comments:</Typography>
                        <Chip label={`${replies.length}`} className={classes.chipStyleWhite} size="small"
                              style={{ marginLeft: '5px', marginRight: '15px' }}/>
                      </div>
                    )}
                  </div>
                </Grid>
                {!mobileLayout && (
                  <Grid id={`showEdit0${id}`} key={`showEdit0${id}`} item xs={1}
                        style={{ pointerEvents: 'none', display: 'none' }}>
                    <EditOutlinedIcon style={{ maxHeight: '1.25rem' }}/>
                  </Grid>
                )}
                <Grid id={`showEdit1${showChip ? '' : id}`} key={`showEdit1${id}`} item xs={12}
                      style={{ paddingTop: `${showChip ? 0 : 0.5}rem` }}>
                  <ReadOnlyQuillEditor value={body} id={`todo${id}`}/>
                </Grid>
              </Grid>
            </RaisedCard>
          </Grid>
        </React.Fragment>
      );
    });
  }

  function toggleShowSelectTodos() {
    const currentShowSelect = showSelectTodos;
    setShowSelectTodos(!showSelectTodos);
    if (currentShowSelect && !_.isEmpty(checked)) {
      let checkedString;
      Object.keys(checked).forEach((anId) => {
        if (checked[anId].isChecked) {
          if (checkedString) {
            checkedString += `&fromCommentId=${anId}`;
          } else {
            checkedString = `#fromCommentId=${anId}`;
          }
        }
      });
      setChecked({});
      if (checkedString) {
        navigate(history, `${formMarketAddInvestibleLink(marketId)}${checkedString}`);
      }
    }
  }

  function onCreateRed(comment) {
    setEditRedCard(undefined);
    if (comment) {
      notifyImmediate(userId, comment, market, messagesDispatch);
    }
    updateCommentAddRedState({ createRedCard: !createRedCard });
  }

  function onCreate () {
    setEditCard(undefined);
    updateCommentAddBlueState({ createCard: !createCard });
  }

  function onCreateYellow () {
    setEditYellowCard(undefined);
    updateCommentAddYellowState({ createYellowCard: !createYellowCard });
  }

  function setElementGreen(elementId) {
    removeElementGreen();
    document.getElementById(elementId).classList.add(classes.containerGreen);
  }

  function removeElementGreen() {
    ['immediateSection', 'convenientSection', 'ableSection'].forEach((elementId) => {
      document.getElementById(elementId).classList.remove(classes.containerGreen);
    });
  }

  function onDrop(event, notificationType) {
    const commentId = event.dataTransfer.getData('text');
    const currentStageId = event.dataTransfer.getData("stageId");
    const currentNotificationType = event.dataTransfer.getData("notificationType");
    if (currentStageId) {
      // This is a story so ignore
      return;
    }
    if (currentNotificationType === notificationType) {
      return;
    }
    setOperationRunning(true);
    removeMessagesForCommentId(commentId, messagesState, messagesDispatch);
    const target = event.target;
    target.style.cursor = 'wait';
    return updateComment(marketId, commentId, undefined, undefined, undefined, undefined,
      notificationType)
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
    onDrop(event, 'RED').then((comment) => notifyImmediate(userId, comment, market, messagesDispatch));
  }

  function onDropConvenient(event) {
    onDrop(event, 'YELLOW');
  }

  function onDropAble(event) {
    onDrop(event, 'BLUE');
  }

  const todosButtonMsgId = showSelectTodos ? 'todosCreateStory' : 'todosSelectForStory';
  const immediateTodosChip = redComments.length > 0 && <Chip label={`${redComments.length}`} color="primary"
                                                             size='small' className={classes.chipStyleRed} />;
  const whenAbleTodosChip = yellowComments.length > 0 && <Chip label={`${yellowComments.length}`} size='small'
                                                               className={classes.chipStyleYellow} />;
  const whenConvenientTodosChip = blueComments.length > 0 && <Chip label={`${blueComments.length}`} color="primary"
                                                                   size='small' className={classes.chipStyleBlue} />;
  const editRedCard = comments.find((comment) => comment.id === editRedCardId);
  const editYellowCard = comments.find((comment) => comment.id === editYellowCardId);
  const editCard = comments.find((comment) => comment.id === editCardId);
  return (
    <div className={classes.outerBorder} id="marketTodos"
         style={{display: sectionOpen ? 'block' : 'none'}}>
      <DismissableText textId="todosHelp" text={
        <div>
          Bugs go in <Link href="https://documentation.uclusion.com/workspaces/todos" target="_blank">todos</Link> so
          notifications based on severity can be sent.
        </div>
      }/>
      <SubSection
        type={SECTION_SUB_HEADER}
        isBlackText
        title={intl.formatMessage({ id: 'todoSection' })}
        helpLink='https://documentation.uclusion.com/workspaces/todos'
        createButton={isInArchives || mobileLayout ? undefined :
          (
            <SpinningIconLabelButton icon={ArrowUpwardIcon} onClick={toggleShowSelectTodos} doSpin={false}
                                     whiteBackground>
              <FormattedMessage id={todosButtonMsgId}/>
          </SpinningIconLabelButton>
          )}
        actionButton={showSelectTodos ? <SpinningIconLabelButton icon={Clear}
                                                                 onClick={() => {
                                                                   setChecked({});
                                                                   setShowSelectTodos(false);
                                                                 }} doSpin={false}
                                                                 whiteBackground>
          <FormattedMessage id="cancel"/>
        </SpinningIconLabelButton> : (mobileLayout ? undefined :
          (
            <SpinningIconLabelButton icon={SettingsBackupRestore} onClick={() => {
              const allMessages = [];
              todoComments.forEach((comment) => {
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
              return deleteOrDehilightMessages(allMessages, messagesDispatch, workItemClasses.removed,
                true)
                .then(() => setOperationRunning(false))
                .finally(() => {
                  setOperationRunning(false);
                });
            }} whiteBackground id="removeTodosNotificationsButton">
              <FormattedMessage id='removeNotifications'/>
            </SpinningIconLabelButton>
          ))}
      >
        <div style={{paddingTop: '1rem'}}>
          {createRedCard && marketId && (
            <CommentAdd
              nameKey="CommentAddRed"
              type={TODO_TYPE}
              commentAddState={commentAddRedState}
              updateCommentAddState={updateCommentAddRedState}
              commentAddStateReset={commentAddStateRedReset}
              marketId={marketId}
              onSave={onCreateRed}
              onDone={onCreateRed}
              defaultNotificationType="RED"
              isStory={false}
            />
          )}
          {editRedCard && (
            <div id={`editc${editRedCardId}`} style={{marginBottom: '2rem'}}>
              <Comment
                depth={0}
                marketId={marketId}
                comment={editRedCard}
                onDone={() => setEditRedCard(undefined)}
                comments={comments}
                allowedTypes={[TODO_TYPE]}
                noAuthor
                showDone
              />
            </div>
          )}
          <SubSection
            type={SECTION_TYPE_SECONDARY_WARNING}
            id="immediateTodos"
            title={intl.formatMessage({ id: 'immediate' })}
            titleIcon={immediateTodosChip === false ? undefined : immediateTodosChip}
            actionButton={ isInArchives ? null :
              (<ExpandableAction
                icon={<AddIcon htmlColor="black"/>}
                label={intl.formatMessage({ id: 'createRedExplanation' })}
                openLabel={intl.formatMessage({ id: 'createTODO' })}
                onClick={onCreateRed}
                disabled={createRedCard}
                tipPlacement="top-end"
              />)}
          >
            <Grid
              container
              className={classes.white}
              id="immediateSection" key="immediateSection" onDrop={onDropImmediate}
              onDragEnd={() => removeElementGreen()}
              onDragEnter={() => setElementGreen('immediateSection')}
              onDragOver={(event) => event.preventDefault()}
            >
              {getCards(redComments, marketId, history, intl, setEditRedCard, 'immediateSection')}
            </Grid>
          </SubSection>
          {!_.isEmpty(redComments) && (<div style={{ paddingBottom: '15px' }}/>)}
          {createYellowCard && marketId && (
            <CommentAdd
              nameKey="CommentAddYellow"
              type={TODO_TYPE}
              commentAddState={commentAddYellowState}
              updateCommentAddState={updateCommentAddYellowState}
              commentAddStateReset={commentAddStateYellowReset}
              marketId={marketId}
              onSave={onCreateYellow}
              onDone={onCreateYellow}
              defaultNotificationType="YELLOW"
              isStory={false}
            />
          )}
          {editYellowCard && (
            <div id={`editc${editYellowCardId}`} style={{marginBottom: '2rem'}}>
              <Comment
                depth={0}
                marketId={marketId}
                comment={editYellowCard}
                onDone={() => setEditYellowCard(undefined)}
                comments={comments}
                allowedTypes={[TODO_TYPE]}
                noAuthor
                showDone
              />
            </div>
          )}
          <SubSection
            type={SECTION_TYPE_WARNING}
            id="whenAbleTodos"
            title={intl.formatMessage({ id: 'able' })}
            titleIcon={whenAbleTodosChip === false ? undefined : whenAbleTodosChip}
            actionButton={ isInArchives ? null :
              (<ExpandableAction
                icon={<AddIcon htmlColor="black" />}
                label={intl.formatMessage({ id: 'createYellowExplanation' })}
                openLabel={intl.formatMessage({ id: 'createTODO' })}
                onClick={onCreateYellow}
                disabled={createYellowCard}
                tipPlacement="top-end"
              />)}
          >
            <Grid
              container
              className={classes.white}
              id="convenientSection" key="convenientSection" onDrop={onDropConvenient}
              onDragEnd={() => removeElementGreen()}
              onDragEnter={() => setElementGreen('convenientSection')}
              onDragOver={(event) => event.preventDefault()}
            >
              {getCards(yellowComments, marketId, history, intl, setEditYellowCard, 'convenientSection')}
            </Grid>
          </SubSection>
          {!_.isEmpty(yellowComments) && (<div style={{ paddingBottom: '15px' }}/>)}
          {createCard && marketId && (
            <CommentAdd
              nameKey="CommentAddBlue"
              type={TODO_TYPE}
              commentAddState={commentAddBlueState}
              updateCommentAddState={updateCommentAddBlueState}
              commentAddStateReset={commentAddStateBlueReset}
              marketId={marketId}
              onDone={onCreate}
              onSave={onCreate}
              defaultNotificationType="BLUE"
              isStory={false}
            />
          )}
          {editCard && (
            <div id={`editc${editCardId}`} style={{marginBottom: '2rem'}}>
              <Comment
                depth={0}
                marketId={marketId}
                comment={editCard}
                onDone={() => setEditCard(undefined)}
                comments={comments}
                allowedTypes={[TODO_TYPE]}
                noAuthor
                showDone
              />
            </div>
          )}
          <SubSection
            type={SECTION_TYPE_TERTIARY_WARNING}
            title={intl.formatMessage({ id: 'convenient' })}
            titleIcon={whenConvenientTodosChip === false ? undefined : whenConvenientTodosChip}
            id="whenConvenientTodos"
            actionButton={ isInArchives ? null :
              (<ExpandableAction
                icon={<AddIcon htmlColor="black"/>}
                label={intl.formatMessage({ id: 'createBlueExplanation' })}
                openLabel={intl.formatMessage({ id: 'createTODO' })}
                onClick={onCreate}
                disabled={createCard}
                tipPlacement="top-end"
              />)}
          >
            <Grid
              container
              className={classes.white}
              id="ableSection" key="ableSection" onDrop={onDropAble}
              onDragEnd={() => removeElementGreen()}
              onDragEnter={() => setElementGreen('ableSection')}
              onDragOver={(event) => event.preventDefault()}
            >
              {getCards(blueComments, marketId, history, intl, setEditCard, 'ableSection')}
            </Grid>
          </SubSection>
        </div>
      </SubSection>
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
