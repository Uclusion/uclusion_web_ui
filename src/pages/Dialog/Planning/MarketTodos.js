import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Grid, Typography } from '@material-ui/core'
import _ from 'lodash'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { useIntl } from 'react-intl'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/core/styles'
import { yellow } from '@material-ui/core/colors'
import { SECTION_TYPE_SECONDARY, SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global'
import SubSection from '../../../containers/SubSection/SubSection'
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor'
import Comment from '../../../components/Comments/Comment'
import { TODO_TYPE } from '../../../constants/comments'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import CommentAdd from '../../../components/Comments/CommentAdd'
import { HighlightedCommentContext } from '../../../contexts/HighlightingContexts/HighlightedCommentContext'

const myClasses = makeStyles(
  theme => {
    return {
      warn: {
        border: `1px solid ${theme.palette.grey['400']}`,
        borderRadius: theme.spacing(1),
        padding: theme.spacing(1, 0, 0, 2),
        overflowY: 'auto',
        maxHeight: '275px',
        backgroundColor: yellow['400'],
      },
      outlined: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        padding: theme.spacing(1, 0, 0, 2),
        overflowY: 'auto',
        maxHeight: '275px'
      },
      white: {
        backgroundColor: "white",
        padding: 0,
        margin: 0
      }
    };
  },
  { name: "Archive" }
);

function MarketTodos(props) {
  const {
    comments,
    marketId,
  } = props;
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory()
  const [highlightedCommentState] = useContext(HighlightedCommentContext)
  const [editCard, setEditCard] = useState(undefined)
  const [createCard, setCreateCard] = useState(undefined);
  const [editRedCard, setEditRedCard] = useState(undefined);
  const [createRedCard, setCreateRedCard] = useState(undefined);
  const [createYellowCard, setCreateYellowCard] = useState(undefined);
  const [editYellowCard, setEditYellowCard] = useState(undefined);
  const blueComments = (comments || []).filter((comment) => comment.notification_type === 'BLUE');
  const yellowComments = (comments || []).filter((comment) => comment.notification_type === 'YELLOW');
  const redComments = (comments || []).filter((comment) => comment.notification_type === 'RED');
  function getCards(comments, marketId, history, intl, setCard) {
    const sortedData = _.sortBy(comments, 'updated_at').reverse();
    return sortedData.map((comment) => {
      const { id, body, updated_at } = comment
      const { level } = highlightedCommentState[id] || {}
      return (
        <Grid
          id={`c${id}`}
          key={`c${id}`}
          item
          md={3}
          xs={12}
        >
          <RaisedCard onClick={() => setCard(comment)} elevation={0}>
            <div className={level ? classes.warn : classes.outlined}>
              <Typography style={{ fontSize: '.75rem', flex: 1 }}>Updated: {intl.formatDate(updated_at)}</Typography>
              <ReadOnlyQuillEditor value={body}/>
            </div>
          </RaisedCard>
        </Grid>
      );
    });
  }

  function onCreateRed() {
    setEditRedCard(false);
    setCreateRedCard(!createRedCard);
  }

  function onCreate() {
    setEditCard(false);
    setCreateCard(!createCard);
  }

  function onCreateYellow() {
    setEditYellowCard(false);
    setCreateYellowCard(!createYellowCard);
  }

  return (
    <>
      <div style={{ marginTop: '30px' }}/>
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
        <Comment
          depth={0}
          marketId={marketId}
          comment={editRedCard}
          onDone={() => setEditRedCard(undefined)}
          comments={comments}
          allowedTypes={[TODO_TYPE]}
          editOpenDefault
          noReply
          noAuthor
        />
      )}
      <SubSection
        type={SECTION_TYPE_SECONDARY_WARNING}
        title={intl.formatMessage({ id: 'immediate' })}
        helpTextId="immediateSectionHelp"
        actionButton={
          (<ExpandableAction
            icon={<AddIcon/>}
            label={intl.formatMessage({ id: 'createRedExplanation' })}
            onClick={onCreateRed}
            tipPlacement="top-end"
          />)}
      >
        <Grid
          container
          className={classes.white}
        >
          {getCards(redComments, marketId, history, intl, setEditRedCard)}
        </Grid>
      </SubSection>
      {!_.isEmpty(redComments) && (<div style={{ paddingBottom: '30px' }}/>)}
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
        <Comment
          depth={0}
          marketId={marketId}
          comment={editYellowCard}
          onDone={() => setEditYellowCard(undefined)}
          comments={comments}
          allowedTypes={[TODO_TYPE]}
          editOpenDefault
          noReply
          noAuthor
        />
      )}
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'able' })}
        helpTextId="ableSectionHelp"
        actionButton={
          (<ExpandableAction
            icon={<AddIcon/>}
            label={intl.formatMessage({ id: 'createYellowExplanation' })}
            onClick={onCreateYellow}
            tipPlacement="top-end"
          />)}
      >
        <Grid
          container
          className={classes.white}
        >
          {getCards(yellowComments, marketId, history, intl, setEditYellowCard)}
        </Grid>
      </SubSection>
      {!_.isEmpty(yellowComments) && (<div style={{ paddingBottom: '30px' }}/>)}
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
        <Comment
          depth={0}
          marketId={marketId}
          comment={editCard}
          onDone={() => setEditCard(undefined)}
          comments={comments}
          allowedTypes={[TODO_TYPE]}
          editOpenDefault
          noReply
          noAuthor
        />
      )}
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'convenient' })}
        helpTextId="convenientSectionHelp"
        actionButton={
          (<ExpandableAction
            icon={<AddIcon/>}
            label={intl.formatMessage({ id: 'createBlueExplanation' })}
            onClick={onCreate}
            tipPlacement="top-end"
          />)}
      >
        <Grid
          container
          className={classes.white}
        >
          {getCards(blueComments, marketId, history, intl, setEditCard)}
        </Grid>
      </SubSection>
      {!_.isEmpty(blueComments) && (<div style={{ paddingBottom: '30px' }}/>)}
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
