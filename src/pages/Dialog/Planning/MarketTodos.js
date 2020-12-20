import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Grid, InputAdornment, TextField, Typography } from '@material-ui/core'
import _ from 'lodash'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { useIntl } from 'react-intl'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/core/styles'
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
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions'
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
      }
    };
  },
  { name: 'Archive' }
);

const EXPANDED_ID = 'todos'

function MarketTodos (props) {
  const {
    comments,
    marketId,
  } = props
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory();
  const [highlightedCommentState] = useContext(HighlightedCommentContext);
  const [expandedCommentState, expandedCommentDispatch] = useContext(ExpandedCommentContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [index] = useContext(SearchIndexContext);
  const myExpandedState = expandedCommentState[EXPANDED_ID] || {};
  const { expanded: showTodos } = myExpandedState;
  const [editCard, setEditCard] = useState(undefined);
  const [createCard, setCreateCard] = useState(undefined);
  const [editRedCard, setEditRedCard] = useState(undefined);
  const [createRedCard, setCreateRedCard] = useState(undefined);
  const [createYellowCard, setCreateYellowCard] = useState(undefined);
  const [editYellowCard, setEditYellowCard] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState(undefined);
  const foundResults = searchQuery ? index.search(searchQuery) : undefined;
  const todoComments = comments.filter(comment => comment.comment_type === TODO_TYPE);
  const restrictedComments = filterCommentsToSearch(foundResults, todoComments) || [];
  const blueComments = restrictedComments.filter((comment) => comment.notification_type === 'BLUE');
  const yellowComments = restrictedComments.filter((comment) => comment.notification_type === 'YELLOW');
  const redComments = restrictedComments.filter((comment) => comment.notification_type === 'RED');

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

  function getCards (commentsGetting, marketId, history, intl, setCard) {
    function setCardAndScroll(comment) {
      setCard(comment);
      navigate(history, `${formMarketLink(marketId)}#editc${comment.id}`);
    }
    if (_.isEmpty(commentsGetting)) {
      return <div className={classes.grow} />
    }
    const sortedData = _.sortBy(commentsGetting, 'updated_at').reverse();
    return sortedData.map((comment) => {
      const { id, body, updated_at } = comment;
      const replies = comments.filter(comment => comment.root_comment_id === id) || [];
      const { level } = highlightedCommentState[id] || {};
      return (
        <Grid
          id={`c${id}`}
          key={`c${id}`}
          item
          md={3}
          xs={12}
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className={classes.outlined}
        >
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
              <ReadOnlyQuillEditor value={body}/>
            </div>
          </RaisedCard>
        </Grid>
      );
    });
  }

  function toggleShowTodos () {
    const toggleValue = showTodos === undefined ? false : !showTodos;
    expandedCommentDispatch({ type: EXPANDED_CONTROL, commentId: EXPANDED_ID, expanded: toggleValue });
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
    setOperationRunning(true);
    updateComment(marketId, commentId, undefined, undefined, undefined, notificationType)
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

  return (
    <>
      <div className={classes.outerBorder}>
        <SubSection
          type={SECTION_SUB_HEADER}
          bolder
          hideChildren={!(showTodos || showTodos === undefined)}
          title={intl.formatMessage({ id: 'todoSection' })}
          helpTextId="todoSectionHelp"
          searchBar={(<TextField
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
                key="CommentAdd"
                type={TODO_TYPE}
                marketId={marketId}
                onSave={onCreateRed}
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
                  editOpenDefault
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
              actionButton={
                (<ExpandableAction
                  icon={<AddIcon htmlColor="white"/>}
                  label={intl.formatMessage({ id: 'createRedExplanation' })}
                  onClick={onCreateRed}
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
                key="CommentAdd"
                type={TODO_TYPE}
                marketId={marketId}
                onSave={onCreateYellow}
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
                  editOpenDefault
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
              actionButton={
                (<ExpandableAction
                  icon={<AddIcon htmlColor="black" />}
                  label={intl.formatMessage({ id: 'createYellowExplanation' })}
                  onClick={onCreateYellow}
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
                key="CommentAdd"
                type={TODO_TYPE}
                marketId={marketId}
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
                  editOpenDefault
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
              actionButton={
                (<ExpandableAction
                  icon={<AddIcon htmlColor="white"/>}
                  label={intl.formatMessage({ id: 'createBlueExplanation' })}
                  onClick={onCreate}
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
