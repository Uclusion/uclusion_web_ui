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
  SECTION_TYPE_SECONDARY_WARNING
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
  formMarketLink,
  navigate
} from '../../../utils/marketIdPathFunctions'
import Chip from '@material-ui/core/Chip'
import { removeHeader, restoreHeader } from '../../../containers/Header'
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
import { getTicketNumber } from '../../../utils/stringFunctions'
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../../constants/notifications';

const myClasses = makeStyles(
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
        marginRight: '5px',
        backgroundColor: '#E85757'
      },
      chipStyleYellow: {
        marginRight: '5px',
        padding: '4px',
        backgroundColor: '#e6e969'
      },
      chipStyleBlue: {
        marginRight: '5px',
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
    marketId, userId,
    groupId,
    isInArchives = false,
    sectionOpen, setSectionOpen,
    hidden
  } = props
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const workItemClasses = workListStyles();
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [beingDraggedHack, setBeingDraggedHack] = useState({});
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
  const blueComments = todoComments.filter((comment) => comment.notification_type === BLUE_LEVEL);
  const yellowComments = todoComments.filter((comment) => comment.notification_type === YELLOW_LEVEL);
  const redComments = todoComments.filter((comment) => comment.notification_type === RED_LEVEL);
  const location = useLocation();
  const { hash } = location;
  const [openMenuTodoId, setOpenMenuTodoId] = useState(undefined);
  const [anchorEl, setAnchorEl] = useState(null);
  const pageName = isInArchives ? 'archives' : '';
  const [commentAddRedStateFull, commentAddRedDispatch] = usePageStateReducer(`commentAddRed${pageName}`);
  const [commentAddRedState, updateCommentAddRedState, commentAddStateRedReset] =
    getPageReducerPage(commentAddRedStateFull, commentAddRedDispatch, groupId);
  const {
    createRedCard,
  } = commentAddRedState;
  const [commentRedStateFull, commentRedDispatch] = usePageStateReducer(`commentRed${pageName}`);
  const [commentRedState, updateCommentRedState, commentStateRedReset] =
    getPageReducerPage(commentRedStateFull, commentRedDispatch, groupId);
  const {
    cardEditing: editRedCardId,
  } = commentRedState;
  const [commentAddYellowStateFull, commentAddYellowDispatch] =
    usePageStateReducer(`commentAddYellow${pageName}`);
  const [commentAddYellowState, updateCommentAddYellowState, commentAddStateYellowReset] =
    getPageReducerPage(commentAddYellowStateFull, commentAddYellowDispatch, groupId);
  const {
    createYellowCard,
  } = commentAddYellowState;
  const [commentYellowStateFull, commentYellowDispatch] =
    usePageStateReducer(`commentYellow${pageName}`);
  const [commentYellowState, updateCommentYellowState, commentStateYellowReset] =
    getPageReducerPage(commentYellowStateFull, commentYellowDispatch, groupId);
  const {
    cardEditing: editYellowCardId,
  } = commentYellowState;
  const [commentAddBlueStateFull, commentAddBlueDispatch] =
    usePageStateReducer(`commentBlueAdd${pageName}`);
  const [commentAddBlueState, updateCommentAddBlueState, commentAddStateBlueReset] =
    getPageReducerPage(commentAddBlueStateFull, commentAddBlueDispatch, groupId);
  const {
    createCard,
  } = commentAddBlueState;
  const [commentBlueStateFull, commentBlueDispatch] =
    usePageStateReducer(`commentBlue${pageName}`);
  const [commentBlueState, updateCommentBlueState, commentStateBlueReset] =
    getPageReducerPage(commentBlueStateFull, commentBlueDispatch, groupId);
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
    if (hash && !hidden) {
      const todoParents = comments.filter(comment => comment.comment_type === TODO_TYPE &&
        !comment.investible_id && !comment.resolved) || [];
      const todoCommentIds = getThreadIds(todoParents, comments);
      const foundCommentId = todoCommentIds.find((anId) => hash.includes(anId));
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
        history.replace(window.location.pathname + window.location.search);
      }
      if ((foundCommentId || hash.includes('Todos')) && !sectionOpen) {
        setSectionOpen();
      }
    }
    return () => {};
  }, [commentStateBlueReset, commentStateRedReset, commentStateYellowReset, comments, hash, hidden, history,
    sectionOpen, setSectionOpen, updateCommentBlueState, updateCommentRedState, updateCommentYellowState]);

  function onDragStart(event, notificationType) {
    removeHeader();
    const commentId = event.target.id.substring('card'.length);
    event.dataTransfer.setData('text', commentId);
    event.dataTransfer.setData('notificationType', notificationType);
    const previousElement = document.getElementById(`drag${commentId}`);
    const previousClass = previousElement ? document.getElementById(`drag${commentId}`).className : undefined;
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
        const drugElement = document.getElementById(`drag${commentId}`);
        if (drugElement) {
          drugElement.className = previousClass;
        }
      }
    }
    if (previousElementId) {
      const previousElement = document.getElementById(previousElementId);
      if (previousElement) {
        previousElement.className = classes.containerEmpty;
      }
    }
    setBeingDraggedHack({});
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

  function getCards(commentsGetting, history, intl, setCard, sectionId) {
    function setCardAndScroll(comment) {
      setCard(comment);
      console.debug(`${formMarketLink(comment.market_id, comment.group_id)}#c${comment.id}`);
      navigate(history, `${formMarketLink(comment.market_id, comment.group_id)}#c${comment.id}`);
    }

    if (_.isEmpty(commentsGetting)) {
      return <div className={classes.grow} key={`${sectionId}empty`}/>
    }
    const sortedData = _.sortBy(commentsGetting, 'updated_at').reverse()
    return sortedData.map((comment) => {
      const { id, body, updated_at, notification_type: notificationType, ticket_code: ticketCode } = comment;
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
      const isSelected = [editYellowCardId, editRedCardId, editCardId].includes(id);
      return (
        <React.Fragment key={`${id}top`}>
          {openMenuTodoId === id && anchorEl && (
            <MarketTodoMenu comment={comment} editViewFunc={setCardAndScroll}
                            openIdFunc={setOpenMenuTodoId} anchorEl={anchorEl} />
          )}
          <Grid
            id={`card${id}`}
            key={`card${id}`}
            item
            md={3}
            xs={12}
            draggable={!operationRunning && !isInArchives}
            onDragStart={(event) => onDragStart(event, notificationType)}
            onDragEnd={onDragEnd}
            className={isSelected ? classes.outlinedSelected : classes.outlined}
            onMouseOver={() => doShowEdit(id)} onMouseOut={() => doRemoveEdit(id)}
          >
            {showSelectTodos && (
              <Checkbox
                value={id}
                checked={isChecked}
                onChange={todoSelectedToggle(id)}
              />
            )}
            <RaisedCard className={isSelected ? classes.raisedCardSelected : undefined} elevation={0}
                        cardClassName={isSelected ? classes.raisedCardSelected :
                          (useHighlight ? classes.warnHighlightedCard : undefined)}
                        onClick={(event) => {
                            if (invalidEditEvent(event, history)) {
                              return
                            }
                            if (isInArchives) {
                              setCardAndScroll(comment)
                            } else {
                              setOpenMenuCard(id, event)
                            }
                        }}
            >
              <Grid container id={`drag${id}`} key={`drag${id}`}
                    className={isSelected ? classes.cardSelected : (useHighlight ? classes.warnCard : classes.card)}>
                <Grid item xs={11} style={{ pointerEvents: 'none' }} key={`wComment${id}`}>
                  <div style={{ display: 'flex' }}>
                    {ticketCode && (
                      <Typography style={{ fontSize: '0.9rem', flex: 1, whiteSpace: 'nowrap' }} variant="body2">
                        B-{getTicketNumber(decodeURI(ticketCode))}
                      </Typography>
                    )}
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
                        style={{ pointerEvents: 'none', visibility: 'hidden' }}>
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
            checkedString = `&fromCommentId=${anId}`;
          }
        }
      });
      setChecked({});
      if (checkedString) {
        navigate(history, `${formMarketAddInvestibleLink(marketId, groupId)}${checkedString}`);
      }
    }
  }

  function onCreateRed(comment) {
    setEditRedCard(undefined);
    if (comment) {
      notifyImmediate(userId, comment, messagesDispatch);
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
      return Promise.resolve(false);
    }
    if (currentNotificationType === notificationType) {
      return Promise.resolve(false);
    }
    setOperationRunning(true);
    removeMessagesForCommentId(commentId, messagesState);
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
    onDrop(event, 'RED').then((comment) => {
      if (comment) {
        notifyImmediate(userId, comment, messagesDispatch);
      }
    });
  }

  function onDropConvenient(event) {
    onDrop(event, 'YELLOW');
  }

  function onDropAble(event) {
    onDrop(event, 'BLUE');
  }

  const todosButtonMsgId = showSelectTodos ? 'todosCreateStory' : 'todosSelectForStory';
  const immediateTodosChip = <Chip color="primary" size='small' className={classes.chipStyleRed} />;
  const yellowChip = <Chip color="primary" size='small' className={classes.chipStyleYellow} />;
  const blueChip = <Chip color="primary" size='small' className={classes.chipStyleBlue} />;
  const editRedCard = comments.find((comment) => comment.id === editRedCardId);
  const editYellowCard = comments.find((comment) => comment.id === editYellowCardId);
  const editCard = comments.find((comment) => comment.id === editCardId);
  return (
    <div className={classes.outerBorder} id="marketTodos"
         style={{display: sectionOpen ? 'block' : 'none', marginTop: '2rem'}}>
      <DismissableText textId="todosHelp" display={!isInArchives && _.isEmpty(search) && _.isEmpty(todoComments)}
                       text={
        <div>
          Use "Create New" below to create a <Link href="https://documentation.uclusion.com/channels/todos" target="_blank">bug</Link> that
          sends notifications based on severity.
        </div>
      }/>
      {!isInArchives && !mobileLayout && (
        <SpinningIconLabelButton icon={ArrowUpwardIcon} onClick={toggleShowSelectTodos} doSpin={false}
                                 whiteBackground>
          <FormattedMessage id={todosButtonMsgId}/>
        </SpinningIconLabelButton>
      )}
      {showSelectTodos ? <SpinningIconLabelButton icon={Clear}
                                                  onClick={() => {
                                                    setChecked({});
                                                    setShowSelectTodos(false);
                                                  }} doSpin={false}
                                                  whiteBackground>
        <FormattedMessage id="cancel"/>
      </SpinningIconLabelButton> : (mobileLayout || isInArchives ? undefined :
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
        <div style={{paddingTop: '1rem'}}>
          {createRedCard && marketId && (
            <CommentAdd
              nameKey="CommentAddRed"
              type={TODO_TYPE}
              commentAddState={commentAddRedState}
              updateCommentAddState={updateCommentAddRedState}
              commentAddStateReset={commentAddStateRedReset}
              marketId={marketId}
              groupId={groupId}
              onSave={onCreateRed}
              onDone={onCreateRed}
              defaultNotificationType="RED"
              isStory={false}
            />
          )}
          {editRedCard && (
            <div id={`c${editRedCardId}`} style={{marginBottom: '2rem', marginRight: '1rem', marginLeft: '1rem'}}>
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
            bolder
            title={intl.formatMessage({ id: 'immediate' })}
            titleIcon={immediateTodosChip}
            actionButton={ isInArchives ? null :
              (<ExpandableAction
                id="immediateTodosButton"
                icon={<AddIcon htmlColor='#E85757'/>}
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
              {getCards(redComments, history, intl, setEditRedCard, 'immediateSection')}
            </Grid>
          </SubSection>
          <div style={{ paddingBottom: '15px' }}/>
          {createYellowCard && marketId && groupId && (
            <CommentAdd
              nameKey="CommentAddYellow"
              type={TODO_TYPE}
              commentAddState={commentAddYellowState}
              updateCommentAddState={updateCommentAddYellowState}
              commentAddStateReset={commentAddStateYellowReset}
              marketId={marketId}
              groupId={groupId}
              onSave={onCreateYellow}
              onDone={onCreateYellow}
              defaultNotificationType="YELLOW"
              isStory={false}
            />
          )}
          {editYellowCard && (
            <div id={`c${editYellowCardId}`} style={{marginBottom: '2rem', marginRight: '1rem',
              marginLeft: '1rem'}}>
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
            type={SECTION_TYPE_SECONDARY_WARNING}
            id="whenAbleTodos"
            bolder
            title={intl.formatMessage({ id: 'able' })}
            titleIcon={yellowChip}
            actionButton={ isInArchives ? null :
              (<ExpandableAction
                id="whenAbleTodosButton"
                icon={<AddIcon htmlColor='#F6BE00' />}
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
              {getCards(yellowComments, history, intl, setEditYellowCard, 'convenientSection')}
            </Grid>
          </SubSection>
          <div style={{ paddingBottom: '15px' }}/>
          {createCard && marketId && (
            <CommentAdd
              nameKey="CommentAddBlue"
              type={TODO_TYPE}
              commentAddState={commentAddBlueState}
              updateCommentAddState={updateCommentAddBlueState}
              commentAddStateReset={commentAddStateBlueReset}
              marketId={marketId}
              groupId={groupId}
              onDone={onCreate}
              onSave={onCreate}
              defaultNotificationType="BLUE"
              isStory={false}
            />
          )}
          {editCard && (
            <div id={`c${editCardId}`} style={{marginBottom: '2rem', marginRight: '1rem', marginLeft: '1rem'}}>
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
            type={SECTION_TYPE_SECONDARY_WARNING}
            bolder
            title={intl.formatMessage({ id: 'convenient' })}
            titleIcon={blueChip}
            id="whenConvenientTodos"
            actionButton={ isInArchives ? null :
              (<ExpandableAction
                id="whenConvenientTodosButton"
                icon={<AddIcon htmlColor="#2F80ED"/>}
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
              {getCards(blueComments, history, intl, setEditCard, 'ableSection')}
            </Grid>
          </SubSection>
        </div>
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
