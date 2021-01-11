import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Checkbox, Grid, InputAdornment, TextField, Typography } from '@material-ui/core'
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
import { HighlightedCommentContext } from '../../../contexts/HighlightingContexts/HighlightedCommentContext'
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
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import SearchIcon from '@material-ui/icons/Search'
import { SearchIndexContext } from '../../../contexts/SearchIndexContext/SearchIndexContext'
import { filterCommentsToSearch } from '../../../contexts/SearchIndexContext/searchIndexContextHelper'
import CloseIcon from '@material-ui/icons/Close'
import Chip from '@material-ui/core/Chip'
import { restoreHeader } from '../../../containers/Header'

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
        maxHeight: '275px'
      },
      card: {
        padding: theme.spacing(1, 0, 0, 2),
        overflowY: 'auto',
        maxHeight: '275px'
      },
      white: {
        backgroundColor: 'white',
        padding: 0,
        margin: 0
      },
      outerBorder: {
        marginTop: '30px',
        border: '1px solid black',
        borderRadius: '6px 6px 0 0'
      },
      chipStyle: {
        marginRight: '5px',
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
      searchInput: {
        background: 'white',
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
    isInArchives
  } = props
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory();
  const [highlightedCommentState] = useContext(HighlightedCommentContext);
  const [expandedCommentState, expandedCommentDispatch] = useContext(ExpandedCommentContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [index] = useContext(SearchIndexContext);
  const myExpandedState = expandedCommentState[marketId] || {};
  const { expanded: showTodos } = myExpandedState;
  const [editCard, setEditCard] = useState(false);
  const [createCard, setCreateCard] = useState(false);
  const [editRedCard, setEditRedCard] = useState(false);
  const [createRedCard, setCreateRedCard] = useState(false);
  const [createYellowCard, setCreateYellowCard] = useState(false);
  const [editYellowCard, setEditYellowCard] = useState(false);
  const [showSelectTodos, setShowSelectTodos] = useState(false);
  const [checked, setChecked] = useState({});
  const [searchQuery, setSearchQuery] = useState(undefined);
  const foundResults = searchQuery ? index.search(searchQuery) : undefined;
  const todoComments = comments.filter(comment => comment.comment_type === TODO_TYPE) || [];
  const restrictedComments = filterCommentsToSearch(foundResults, todoComments) || [];
  const blueComments = restrictedComments.filter((comment) => comment.notification_type === 'BLUE');
  const yellowComments = restrictedComments.filter((comment) => comment.notification_type === 'YELLOW');
  const redComments = restrictedComments.filter((comment) => comment.notification_type === 'RED');
  const location = useLocation();
  const { hash } = location;

  useEffect(() => {
    if (!showTodos && hash && todoComments.find((comment) => hash.includes(comment.id))) {
      expandedCommentDispatch({ type: EXPANDED_CONTROL, commentId: marketId, expanded: true });
    }
    return () => {};
  }, [expandedCommentDispatch, hash, marketId, showTodos, todoComments]);

  function onDragStart(event) {
    event.dataTransfer.setData('text', event.target.id.substring(1));
  }

  function onDragEnd() {
    restoreHeader();
    // We don't know where we were dragged so just turn all dashed lines off
    const marketStages = getStages(marketStagesState, marketId) || [];
    const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
    marketStages.forEach((stage) => {
      marketPresences.forEach((presence) => {
        const elementId = `${stage.id}_${presence.id}`;
        const element = document.getElementById(elementId);
        if (element) {
          element.className = classes.containerEmpty;
        }
      });
    });
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
      const { id, body, updated_at } = comment;
      const replies = comments.filter(comment => comment.root_comment_id === id) || [];
      const { level } = highlightedCommentState[id] || {};
      const { isChecked } = checked[id] || { isChecked: false };
      return (
        <Grid
          id={`c${id}`}
          key={`c${id}`}
          item
          md={3}
          xs={12}
          draggable={!operationRunning}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className={classes.outlined}
        >
          {showSelectTodos && (
            <Checkbox
              value={id}
              checked={isChecked}
              onChange={todoSelectedToggle(id)}
            />
          )}
          <RaisedCard onClick={() => setCardAndScroll(comment)} elevation={0}>
            <div className={level ? classes.warnCard : classes.card}>
              <div style={{display: 'flex'}}>
                <Typography style={{ fontSize: '.75rem', flex: 1 }}>Updated: {intl.formatDate(updated_at)}</Typography>
                {replies.length > 0 && (
                  <div style={{display: 'flex'}}>
                    <Typography style={{ fontSize: '.75rem' }}>Comments:</Typography>
                    <Chip label={`${replies.length}`} color="primary" size='small'
                          style={{ marginLeft: '5px', marginRight: '15px'}} />
                  </div>
                )}
              </div>
              <ReadOnlyQuillEditor value={body} notificationId={id}/>
            </div>
          </RaisedCard>
        </Grid>
      );
    });
  }

  function toggleShowTodos () {
    const toggleValue = showTodos === undefined ? false : !showTodos;
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
    setEditRedCard(false);
    setCreateRedCard(!createRedCard);
  }

  function onCreate () {
    setEditCard(false);
    setCreateCard(!createCard);
  }

  function onCreateYellow () {
    setEditYellowCard(false);
    setCreateYellowCard(!createYellowCard);
  }

  function onDrop(event, notificationType) {
    const commentId = event.dataTransfer.getData('text');
    const currentStageId = event.dataTransfer.getData("stageId");
    if (currentStageId) {
      // This is a story so ignore
      return;
    }
    setOperationRunning(true);
    updateComment(marketId, commentId, undefined, undefined, undefined, undefined, notificationType)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
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
  const isSingleTodoSelected = editRedCard || editYellowCard || editCard;
  return (
    <>
      <div className={classes.outerBorder}>
        <SubSection
          type={SECTION_SUB_HEADER}
          bolder
          hideChildren={!(showTodos || showTodos === undefined)}
          title={intl.formatMessage({ id: 'todoSection' })}
          helpTextId="todoSectionHelp"
          searchBar={isSingleTodoSelected ? undefined : (<TextField
            style={{paddingTop: '3px', width: '300px'}}
            onFocus={() => {
                if (!showTodos) {
                  toggleShowTodos();
                }
              }
            }
            onChange={(event) => setSearchQuery(event.target.value)}
            value={searchQuery}
            placeholder={intl.formatMessage({ id: 'searchBoxPlaceholder' })}
            variant="outlined"
            size="small"
            InputProps={{
              className: classes.searchInput,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment style={{cursor: 'pointer'}} onClick={() => setSearchQuery('')}
                                position="end">
                  <CloseIcon/>
                </InputAdornment>
              ) : null,
            }}/>)}
          createButton={ isSingleTodoSelected || isInArchives ? undefined :
            (<Button
              onClick={toggleShowSelectTodos}
              className={classes.actionSecondary}
              color="secondary"
              variant="contained"
            >
              <FormattedMessage
                id={intl.formatMessage({ id: showSelectTodos ? 'todosCreateStory'
                    : 'todosSelectForStory' })}
              />
            </Button>
            )}
          actionButton={
            (<ExpandableAction
              icon={showTodos ? <ExpandLess htmlColor="black"/> : <ExpandMoreIcon htmlColor="black"/>}
              label={intl.formatMessage({ id: 'toggleTodosExplanation' })}
              onClick={toggleShowTodos}
              tipPlacement="top-end"
            />)}
        >
          <div className={showTodos || showTodos === undefined ? classes.containerEmpty : classes.containerHidden }>
            {createRedCard && (
              <CommentAdd
                key="CommentAddRed"
                type={TODO_TYPE}
                marketId={marketId}
                onSave={onCreateRed}
                onDone={onCreateRed}
                defaultNotificationType="RED"
                isStory={false}
              />
            )}
            {editRedCard && (
              <div id={`editc${editRedCard.id}`}>
                <Comment
                  depth={0}
                  marketId={marketId}
                  comment={editRedCard}
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
              title={intl.formatMessage({ id: 'immediate' })}
              titleIcon={<Chip label={`${redComments.length}`} color="primary" size='small'
                               className={classes.chipStyle} />}
              helpTextId="immediateSectionHelp"
              actionButton={ isInArchives ? null :
                (<ExpandableAction
                  icon={<AddIcon htmlColor="white"/>}
                  label={intl.formatMessage({ id: 'createRedExplanation' })}
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
            {createYellowCard && (
              <CommentAdd
                key="CommentAddYellow"
                type={TODO_TYPE}
                marketId={marketId}
                onSave={onCreateYellow}
                onDone={onCreateYellow}
                defaultNotificationType="YELLOW"
                isStory={false}
              />
            )}
            {editYellowCard && (
              <div id={`editc${editYellowCard.id}`}>
                <Comment
                  depth={0}
                  marketId={marketId}
                  comment={editYellowCard}
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
              title={intl.formatMessage({ id: 'able' })}
              titleIcon={<Chip label={`${yellowComments.length}`} color="primary" size='small'
                               className={classes.chipStyle} />}
              helpTextId="ableSectionHelp"
              actionButton={ isInArchives ? null :
                (<ExpandableAction
                  icon={<AddIcon htmlColor="black" />}
                  label={intl.formatMessage({ id: 'createYellowExplanation' })}
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
            {createCard && (
              <CommentAdd
                key="CommentAddBlue"
                type={TODO_TYPE}
                marketId={marketId}
                onDone={onCreate}
                onSave={onCreate}
                defaultNotificationType="BLUE"
                isStory={false}
              />
            )}
            {editCard && (
              <div id={`editc${editCard.id}`}>
                <Comment
                  depth={0}
                  marketId={marketId}
                  comment={editCard}
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
              title={intl.formatMessage({ id: 'convenient' })}
              titleIcon={<Chip label={`${blueComments.length}`} color="primary" size='small'
                               className={classes.chipStyle} />}
              helpTextId="convenientSectionHelp"
              actionButton={ isInArchives ? null :
                (<ExpandableAction
                  icon={<AddIcon htmlColor="white"/>}
                  label={intl.formatMessage({ id: 'createBlueExplanation' })}
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
