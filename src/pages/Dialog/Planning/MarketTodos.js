import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Checkbox, Grid, Typography } from '@material-ui/core'
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
import { REPLY_TYPE, TODO_TYPE } from '../../../constants/comments'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import CommentAdd from '../../../components/Comments/CommentAdd'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { EXPANDED_CONTROL, ExpandedCommentContext } from '../../../contexts/CommentsContext/ExpandedCommentContext'
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
import { ExpandLess } from '@material-ui/icons'
import Chip from '@material-ui/core/Chip'
import { removeHeader, restoreHeader } from '../../../containers/Header'
import { LocalPlanningDragContext } from './InvestiblesByWorkspace'
import { findMessageForCommentId } from '../../../utils/messageUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { isTinyWindow } from '../../../utils/windowUtils'
import MarketTodoMenu from './MarketTodoMenu'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined'
import { doRemoveEdit, doShowEdit } from './userUtils'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { usePageStateReducer } from '../../../components/PageState/pageStateHooks'

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
        margin: 0
      },
      outerBorder: {
        marginTop: '30px',
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
    marketId,
    isInArchives,
  } = props
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory();
  const [expandedCommentState, expandedCommentDispatch] = useContext(ExpandedCommentContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [beingDraggedHack, setBeingDraggedHack] = useContext(LocalPlanningDragContext);
  const [messagesState] = useContext(NotificationsContext);
  const myExpandedState = expandedCommentState[marketId] || {};
  const { expanded: showTodos } = myExpandedState;
  const [showSelectTodos, setShowSelectTodos] = useState(false);
  const [checked, setChecked] = useState({});
  const todoComments = comments.filter(comment => comment.comment_type === TODO_TYPE) || [];
  const blueComments = todoComments.filter((comment) => comment.notification_type === 'BLUE');
  const yellowComments = todoComments.filter((comment) => comment.notification_type === 'YELLOW');
  const redComments = todoComments.filter((comment) => comment.notification_type === 'RED');
  const location = useLocation();
  const { hash } = location;
  const [openMenuTodoId, setOpenMenuTodoId] = useState(undefined);
  const [anchorEl, setAnchorEl] = useState(null);
  const undefinedIsOpenDefault = !_.isEmpty(todoComments);
  const [commentAddRedState, updateCommentAddRedState, commentAddStateRedReset] =
    usePageStateReducer(`commentAddRed${marketId}`);
  const {
    createRedCard,
  } = commentAddRedState;
  const [commentRedState, updateCommentRedState, commentStateRedReset] =
    usePageStateReducer(`commentRed${marketId}`);
  const {
    cardEditing: editRedCardId,
  } = commentRedState;
  const [commentAddYellowState, updateCommentAddYellowState, commentAddStateYellowReset] =
    usePageStateReducer(`commentAddYellow${marketId}`);
  const {
    createYellowCard,
  } = commentAddYellowState;
  const [commentYellowState, updateCommentYellowState, commentStateYellowReset] =
    usePageStateReducer(`commentYellow${marketId}`);
  const {
    cardEditing: editYellowCardId,
  } = commentYellowState;
  const [commentAddBlueState, updateCommentAddBlueState, commentAddStateBlueReset] =
    usePageStateReducer(`commentBlueAdd${marketId}`);
  const {
    createCard,
  } = commentAddBlueState;
  const [commentBlueState, updateCommentBlueState, commentStateBlueReset] =
    usePageStateReducer(`commentBlue${marketId}`);
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
      const todoParents = comments.filter(comment => comment.comment_type === TODO_TYPE) || [];
      const todoCommentIds = [];
      todoParents.forEach((comment) => {
        todoCommentIds.push(comment.id);
        comments.forEach((treeCandidate) => {
          const { root_comment_id: rootId } = treeCandidate;
          if (comment.id === rootId) {
            todoCommentIds.push(treeCandidate.id);
          }
        })
      })
      const foundCommentId = todoCommentIds.find((anId) => hash.includes(anId));
      if (foundCommentId) {
        const foundComment = comments.find((comment) => comment.id === foundCommentId);
        const { root_comment_id: rootId, comment_type: commentType } = foundComment;
        let rootComment = foundComment;
        if (commentType === REPLY_TYPE) {
          rootComment = comments.find((comment) => comment.id === rootId);
        }
        const { notification_type: notificationType } = rootComment;
        if (notificationType === 'RED') {
          setEditRedCard(rootComment);
        } else if (notificationType === 'YELLOW') {
          setEditYellowCard(rootComment);
        } else {
          setEditCard(rootComment);
        }
      }
      if ((foundCommentId || hash.includes('Todos')) && !showTodos) {
        expandedCommentDispatch({ type: EXPANDED_CONTROL, commentId: marketId, expanded: true });
      }
    }
    return () => {};
  }, [commentStateBlueReset, commentStateRedReset, commentStateYellowReset, comments, expandedCommentDispatch,
    hash, marketId, showTodos, updateCommentBlueState, updateCommentRedState, updateCommentYellowState]);

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

  function getCards (commentsGetting, marketId, history, intl, setCard) {
    function setCardAndScroll(comment) {
      setCard(comment);
      navigate(history,
        `${isInArchives ? formMarketArchivesLink(marketId) : formMarketLink(marketId)}#editc${comment.id}`);
    }
    if (_.isEmpty(commentsGetting)) {
      return <div className={classes.grow} />
    }
    const sortedData = _.sortBy(commentsGetting, 'updated_at').reverse();
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
        <>
          {openMenuTodoId === id && anchorEl && (
            <MarketTodoMenu comment={comment} editViewFunc={setCardAndScroll}
                            openIdFunc={setOpenMenuTodoId} anchorEl={anchorEl} messages={messages} />
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
              if (isInArchives) {
                setCardAndScroll(comment);
              } else {
                setOpenMenuCard(id, event);
              }
            }}>
              <Grid container id={`drag${id}`} className={useHighlight ? classes.warnCard : classes.card}>
                <Grid item xs={11} style={{pointerEvents: 'none'}}>
                  <div style={{display: 'flex'}}>
                    <Typography style={{ fontSize: '.75rem', flex: 1 }}>
                      Updated: {intl.formatDate(updated_at)}
                    </Typography>
                    {showChip && (
                      <div style={{display: 'flex'}}>
                        <Typography style={{ fontSize: '.75rem' }}>Comments:</Typography>
                        <Chip label={`${replies.length}`} className={classes.chipStyleWhite} size='small'
                              style={{ marginLeft: '5px', marginRight: '15px'}} />
                      </div>
                    )}
                  </div>
                </Grid>
                <Grid id={`showEdit0${id}`} item xs={1} style={{pointerEvents: 'none', display: 'none'}}>
                  <EditOutlinedIcon style={{maxHeight: '1.25rem'}} />
                </Grid>
                <Grid id={`showEdit1${showChip ? '' : id}`} item xs={12} style={{pointerEvents: 'none',
                  paddingTop: `${showChip ? 0 : 0.5}rem`}}>
                  <ReadOnlyQuillEditor value={body} />
                </Grid>
              </Grid>
            </RaisedCard>
          </Grid>
        </>
      );
    });
  }

  function toggleShowTodos () {
    const toggleValue = showTodos === undefined ? !undefinedIsOpenDefault : !showTodos;
    if (!toggleValue) {
      setEditRedCard(undefined);
      setEditYellowCard(undefined);
      setEditCard(undefined);
      setShowSelectTodos(false);
    }
    expandedCommentDispatch({ type: EXPANDED_CONTROL, commentId: marketId, expanded: toggleValue });
  }

  function toggleShowSelectTodos() {
    if (!showTodos) {
      toggleShowTodos();
    }
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

  function onCreateRed () {
    setEditRedCard(undefined);
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
    const target = event.target;
    target.style.cursor = 'wait';
    updateComment(marketId, commentId, undefined, undefined, undefined, undefined,
      notificationType)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        setOperationRunning(false);
      }).finally(() => {
      target.style.cursor = 'pointer';
      setOperationRunning(false);
    });
  }

  function onDropImmediate(event) {
    onDrop(event, 'RED');
  }

  function onDropConvenient(event) {
    onDrop(event, 'YELLOW');
  }

  function onDropAble(event) {
    onDrop(event, 'BLUE');
  }
  const isSingleTodoSelected = editRedCardId || editYellowCardId || editCardId;
  const todosButtonMsgId = showSelectTodos ? 'todosCreateStory' : 'todosSelectForStory';
  const immediateTodosChip = redComments.length > 0 && <Chip label={`${redComments.length}`} color="primary"
                                                             size='small' className={classes.chipStyleRed} />;
  const whenAbleTodosChip = yellowComments.length > 0 && <Chip label={`${yellowComments.length}`} size='small'
                                                               className={classes.chipStyleYellow} />;
  const whenConvenientTodosChip = blueComments.length > 0 && <Chip label={`${blueComments.length}`} color="primary"
                                                                   size='small' className={classes.chipStyleBlue} />;
  return (
    <>
      <div className={classes.outerBorder} id="marketTodos">
        <SubSection
          type={SECTION_SUB_HEADER}
          isBlackText
          hideChildren={showTodos === false || (showTodos === undefined && !undefinedIsOpenDefault)}
          titleIcon={!showTodos ? (<div>{immediateTodosChip} {whenAbleTodosChip} {whenConvenientTodosChip}</div>)
            : undefined}
          title={intl.formatMessage({ id: 'todoSection' })}
          helpTextId="todoSectionHelp"
          createButton={ isSingleTodoSelected || isInArchives || isTinyWindow() ? undefined :
            (
            <SpinningIconLabelButton icon={ArrowUpwardIcon} onClick={toggleShowSelectTodos} doSpin={false}
                                     whiteBackground>
              <FormattedMessage id={todosButtonMsgId} />
            </SpinningIconLabelButton>
            )}
          actionButton={
            (<ExpandableAction
              icon={showTodos ? <ExpandLess htmlColor="black"/> : <ExpandMoreIcon htmlColor="black"/>}
              label={intl.formatMessage({ id: 'toggleTodosExplanation' })}
              onClick={toggleShowTodos}
              tipPlacement="top-end"
            />)}
        >
          <div style={{paddingTop: '1rem'}}>
            <CommentAdd
              key="CommentAddRed"
              hidden={!createRedCard}
              type={TODO_TYPE}
              commentAddState={commentAddRedState}
              updateCommentAddState={updateCommentAddRedState}
              commentAddStateReset={commentAddStateRedReset}
              marketId={marketId}
              mentionsAllowed={false}
              onSave={onCreateRed}
              onDone={onCreateRed}
              defaultNotificationType="RED"
              isStory={false}
            />
            {editRedCardId && (
              <div id={`editc${editRedCardId}`} style={{marginBottom: '2rem'}}>
                <Comment
                  depth={0}
                  marketId={marketId}
                  comment={comments.find((comment) => comment.id === editRedCardId)}
                  onDone={() => setEditRedCard(undefined)}
                  comments={comments}
                  allowedTypes={[TODO_TYPE]}
                  editOpenDefault={!isInArchives}
                  noAuthor
                />
              </div>
            )}
            <SubSection
              type={SECTION_TYPE_SECONDARY_WARNING}
              id="immediateTodos"
              title={intl.formatMessage({ id: 'immediate' })}
              titleIcon={immediateTodosChip === false ? undefined : immediateTodosChip}
              helpTextId="immediateSectionHelp"
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
                id="immediateSection" onDrop={onDropImmediate}
                onDragOver={(event) => event.preventDefault()}
              >
                {getCards(redComments, marketId, history, intl, setEditRedCard)}
              </Grid>
            </SubSection>
            {!_.isEmpty(redComments) && (<div style={{ paddingBottom: '15px' }}/>)}
            <CommentAdd
              key="CommentAddYellow"
              hidden={!createYellowCard}
              type={TODO_TYPE}
              commentAddState={commentAddYellowState}
              updateCommentAddState={updateCommentAddYellowState}
              commentAddStateReset={commentAddStateYellowReset}
              marketId={marketId}
              onSave={onCreateYellow}
              onDone={onCreateYellow}
              mentionsAllowed={false}
              defaultNotificationType="YELLOW"
              isStory={false}
            />
            {editYellowCardId && (
              <div id={`editc${editYellowCardId}`} style={{marginBottom: '2rem'}}>
                <Comment
                  depth={0}
                  marketId={marketId}
                  comment={comments.find((comment) => comment.id === editYellowCardId)}
                  onDone={() => setEditYellowCard(undefined)}
                  comments={comments}
                  allowedTypes={[TODO_TYPE]}
                  editOpenDefault={!isInArchives}
                  noAuthor
                />
              </div>
            )}
            <SubSection
              type={SECTION_TYPE_WARNING}
              id="whenAbleTodos"
              title={intl.formatMessage({ id: 'able' })}
              titleIcon={whenAbleTodosChip === false ? undefined : whenAbleTodosChip}
              helpTextId="ableSectionHelp"
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
                id="convenientSection" onDrop={onDropConvenient}
                onDragOver={(event) => event.preventDefault()}
              >
                {getCards(yellowComments, marketId, history, intl, setEditYellowCard)}
              </Grid>
            </SubSection>
            {!_.isEmpty(yellowComments) && (<div style={{ paddingBottom: '15px' }}/>)}
            <CommentAdd
              key="CommentAddBlue"
              hidden={!createCard}
              type={TODO_TYPE}
              commentAddState={commentAddBlueState}
              updateCommentAddState={updateCommentAddBlueState}
              commentAddStateReset={commentAddStateBlueReset}
              marketId={marketId}
              mentionsAllowed={false}
              onDone={onCreate}
              onSave={onCreate}
              defaultNotificationType="BLUE"
              isStory={false}
            />
            {editCardId && (
              <div id={`editc${editCardId}`} style={{marginBottom: '2rem'}}>
                <Comment
                  depth={0}
                  marketId={marketId}
                  comment={comments.find((comment) => comment.id === editCardId)}
                  onDone={() => setEditCard(undefined)}
                  comments={comments}
                  allowedTypes={[TODO_TYPE]}
                  editOpenDefault={!isInArchives}
                  noAuthor
                />
              </div>
            )}
            <SubSection
              type={SECTION_TYPE_TERTIARY_WARNING}
              padChildren
              title={intl.formatMessage({ id: 'convenient' })}
              titleIcon={whenConvenientTodosChip === false ? undefined : whenConvenientTodosChip}
              id="whenConvenientTodos"
              helpTextId="convenientSectionHelp"
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
                id="ableSection" onDrop={onDropAble}
                onDragOver={(event) => event.preventDefault()}
              >
                {getCards(blueComments, marketId, history, intl, setEditCard)}
              </Grid>
            </SubSection>
          </div>
        </SubSection>
      </div>
      <div style={{ marginTop: '30px' }}/>
    </>
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
