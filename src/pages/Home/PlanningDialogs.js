import React, { useContext } from 'react'
import { CardActions, CardContent, Grid, Link, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import _ from 'lodash'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { formInvestibleLink, formMarketLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import {
  getInvestibleName,
  getMarketInvestibles
} from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import DialogActions from './DialogActions'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketInfo, getMarketUpdatedAt } from '../../utils/userFunctions'
import { ACTIVE_STAGE } from '../../constants/markets'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments'
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects'
import Badge from '@material-ui/core/Badge'
import BlockIcon from '@material-ui/icons/Block'
import HelpIcon from '@material-ui/icons/Help'
import AssignmentIcon from '@material-ui/icons/Assignment'
import GravatarGroup from '../../components/Avatars/GravatarGroup';
import { doRemoveEdit, doShowEdit } from '../Dialog/Planning/userUtils'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { getSortedRoots } from '../../containers/CommentBox/CommentBox'
import WorkIcon from '@material-ui/icons/Work'
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'

const useStyles = makeStyles((theme) => ({
  paper: {
    textAlign: 'left',
    minHeight: '250px'
  },
  textData: {
    fontSize: 12,
  },
  green: {
    backgroundColor: '#3f6b72',
  },
  guest: {
    fontSize: '.825rem',
    lineHeight: 2,
    marginTop: '12px',
    marginRight: '90px'
  },
  draft: {
    color: '#E85757',
    backgroundColor: '#ffc4c4',
    padding: '.5rem 1rem',
    border: '1px solid #E85757',
    borderRadius: '32px',
    fontSize: '.825rem',
    lineHeight: 2,
    marginTop: '12px',
    alignItem: 'left',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  upperLeft: {
    textAlign: 'left',
    fontSize: '.825rem'
  },
  innerContainer: {
    borderBottom: '1px solid #f2f2f2',
    paddingTop: '1rem',
    paddingBottom: '2rem',
    flex: 2,
    cursor: 'pointer'
  },
  innerContainerMobile: {
    borderBottom: '1px solid #f2f2f2',
    paddingTop: '1rem',
    flex: 2,
    cursor: 'pointer'
  },
  bottomContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: '1rem',
    justifyContent: 'space-between',
  },
  draftContainer: {
    height: '50px',
    width: 'fit-content',
  },
  participantContainer: {
    height: '50px',
    width: 'fit-content',
  },
  participantText: {
    fontSize: '.7rem'
  },
  childText: {
    fontSize: '.825rem'
  },
  spacer: {
    borderColor: '#ccc',
    borderStyle: 'solid',
    margin: '2rem 0'
  },
  workspaceIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 'auto',
  },
  workspaceCommentsIcons: {
    marginTop: '1.2rem',
    '& > *': {
      marginBottom: theme.spacing(2),
    },
    '& .MuiBadge-root': {
      marginRight: theme.spacing(2),
    },
  },
  archiveIconContainer: {
    flexWrap: 'nowrap',
  },
  lessPadding: {
    '&.MuiGrid-item': {
      padding: '10px'
    }
  },
  chipItemQuestion: {
    color: '#2F80ED',
  },
  chipItemIssue: {
    color: '#E85757',
  },
  chipItemSuggestion: {
    color: '#e6e969',
  },
  chipItemTodo: {
    color: '#F29100',
  },
  chipItemStory: {
    color: 'black',
  },
  chipItemEmpty: {
    color: 'gray',
  },
  titleContainer: {
    width: 'auto',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  title: {
    marginLeft: '1rem'
  }
}));

function PlanningDialogs(props) {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const largeLayout = useMediaQuery(theme.breakpoints.up('xl'));
  const { markets } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { search } = searchResults;

  function getParticipantInfo(presences) {

      return (
        <div style={{flex: 7}}>
          <Typography className={classes.participantText}>{intl.formatMessage({ id: 'dialogParticipants' })}</Typography>
          <Grid
            container
            style={{width: 'auto', display: 'inline-block'}}
          >
            <Grid
              item
              xs={3}
            >
              <GravatarGroup
                users={presences}
                gravatarClassName={classes.green}
                />
              </Grid> 
          </Grid>
        </div>
      );
  }

  function getCommentsCount(comments, commentType) {
    return comments.filter((comment) => comment.comment_type === commentType).length;
  }

  function getActiveInvestibles(investibles, marketId) {
    const marketStages = getStages(marketStagesState, marketId);
    return investibles.filter((investible) => {
      const marketInfo = getMarketInfo(investible, marketId) || {};
      const { stage: currentStageId } = marketInfo;
      const stage = marketStages.find((fullStage) => fullStage.id === currentStageId);
      return stage && !stage.appears_in_market_summary && stage.allows_assignment
        && (stage.appears_in_context || stage.move_on_comment)
    });
  }

  function getMarketItems() {
    const marketsWithUpdatedAt = markets.map((market) => {
      const { id: marketId, updated_at: updatedAt } = market;
      const comments = getMarketComments(commentsState, marketId) || [];
      let commentsToCount = comments.filter((comment) => !comment.resolved && !comment.investible_id);
      if (!_.isEmpty(search)) {
        commentsToCount = getSortedRoots(comments, searchResults);
      }
      const investiblesToCountRaw = getMarketInvestibles(investibleState, marketId, searchResults) || [];
      const investiblesToCount = !_.isEmpty(search) ? investiblesToCountRaw :
        getActiveInvestibles(investiblesToCountRaw, marketId);
      const issueCount = getCommentsCount(commentsToCount, ISSUE_TYPE);
      const questionCount = getCommentsCount(commentsToCount, QUESTION_TYPE);
      const suggestCount = getCommentsCount(commentsToCount, SUGGEST_CHANGE_TYPE);
      const todoCount = getCommentsCount(commentsToCount, TODO_TYPE);
      const investibles = getMarketInvestibles(investibleState, marketId) || [];
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const marketUpdatedAt = getMarketUpdatedAt(updatedAt, marketPresences, investibles, comments, marketId);
      return { ...market, marketUpdatedAt, questionCount, issueCount, suggestCount, todoCount,
        investiblesCount: investiblesToCount.length }
    });
    const sortedMarkets = _.sortBy(marketsWithUpdatedAt, 'marketUpdatedAt').reverse();
    return sortedMarkets.map((market, index) => {
      const {
        id: marketId, name, market_type: marketType, market_stage: marketStage,
        parent_market_id: parentMarketId, parent_investible_id: parentInvestibleId, marketUpdatedAt, questionCount,
        issueCount, suggestCount, todoCount, investiblesCount
      } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(messagesState, marketId);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following && !presence.market_banned);
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      let parentName;
      if (parentInvestibleId) {
        parentName = getInvestibleName(parentInvestibleId, investibleState);
      }
      const updatedMessageId = marketStage === ACTIVE_STAGE ? 'homeUpdated' : 'homeArchived';
      return (
        <Grid
          item
          id={`ws${index}`}
          key={marketId}
          md={4}
          xs={12}
          className={classes.lessPadding}
          onMouseOver={() => doShowEdit(marketId)} onMouseOut={() => doRemoveEdit(marketId, myPresence.market_guest)}
        >
          <RaisedCard
            className={classes.paper}
            elevation={3}
          >
            <Grid container style={{cursor: 'pointer'}}
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    navigate(history, formMarketLink(marketId));}
            }>
              <Grid item xs={10} style={{pointerEvents: 'none'}}>
                <Typography className={classes.upperLeft}>
                  {intl.formatMessage({ id: updatedMessageId }, { x: intl.formatDate(marketUpdatedAt) })}
                </Typography>
              </Grid>
              <Grid item xs={1}>
                {myPresence.market_guest && (
                  <Typography className={classes.guest}>
                    {intl.formatMessage({ id: 'guest' })}
                  </Typography>
                )}
              </Grid>
              <Grid id={`showEdit0${marketId}`} item xs={1} style={{pointerEvents: 'none', display: 'none'}}>
                <EditOutlinedIcon style={{maxHeight: '1.25rem'}} />
              </Grid>
            </Grid>
            <CardContent id={`showEdit1${marketId}`} className={classes.cardContent}
                         style={{paddingTop: `${myPresence.market_guest ? '0' : '0.5rem'}`}}>
            {parentMarketId &&
              <Link
                href={formInvestibleLink(parentMarketId, parentInvestibleId)}
                variant="inherit"
                underline="always"
                color="primary"
                onClick={
                  (event) => {
                    preventDefaultAndProp(event);
                    navigate(history, formInvestibleLink(parentMarketId, parentInvestibleId));
                  }
                }
              >
                <Typography className={classes.childText}>
                  {intl.formatMessage({ id: 'homeChildLinkName' }, { x: parentName })}
                </Typography>
            </Link>
              }
              <div className={!mobileLayout ? classes.innerContainer : classes.innerContainerMobile}
                onClick={(event) => {
                  preventDefaultAndProp(event);
                  navigate(history, formMarketLink(marketId));}
                }
              >
                <Typography 
                  variant={!mobileLayout ? 'h5' : 'h6'}
                >
                    {name}
                </Typography>
              </div>
              <div className={classes.bottomContainer}>
                <span className={classes.participantContainer}>
                  {!isDraft && getParticipantInfo(sortedPresences, marketId)}
                  {isDraft && (
                    <div className={classes.draftContainer}>
                      <Typography className={classes.draft}>
                        {intl.formatMessage({ id: 'draft' })}
                      </Typography>
                    </div>
                  )}
                </span>
                {largeLayout && (
                  <span className={classes.workspaceIconContainer}>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'suggestCount' :
                        'suggestSearchCount' })}>
                      <Badge badgeContent={suggestCount} showZero>
                        <EmojiObjectsIcon
                          className={suggestCount === 0 ? classes.chipItemEmpty : classes.chipItemSuggestion}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'todoCount' :
                        'todoSearchCount' })}>
                      <Badge badgeContent={todoCount} showZero>
                        <AssignmentIcon
                          className={todoCount === 0 ? classes.chipItemEmpty : classes.chipItemTodo}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'questionCount' : 
                        'questionSearchCount' })}>
                      <Badge badgeContent={questionCount}>
                        <HelpIcon
                          className={questionCount === 0 ? classes.chipItemEmpty : classes.chipItemQuestion}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'issueCount' :
                        'issueSearchCount' })}>
                      <Badge badgeContent={issueCount} showZero>
                        <BlockIcon
                          className={issueCount === 0 ? classes.chipItemEmpty : classes.chipItemIssue}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'storyCount' :
                      'storySearchCount' })}>
                      <Badge badgeContent={investiblesCount} showZero>
                        <WorkIcon
                          className={investiblesCount === 0 ? classes.chipItemEmpty : classes.chipItemStory}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                </span>
                )}
                <span className={classes.archiveIconContainer}>
                  {_.isEmpty(search) && (
                    <CardActions style={{display: 'inline-block', flex: 5, marginTop: '0.5rem'}}>
                      <DialogActions
                        marketStage={marketStage}
                        marketId={marketId}
                        marketType={marketType}
                        marketPresences={marketPresences}
                        parentMarketId={parentMarketId}
                        parentInvestibleId={parentInvestibleId}
                        isAdmin
                        isFollowing={myPresence.following}
                        hideEdit={true}
                      />
                    </CardActions>
                  )}
                </span>
              </div>
              {!largeLayout && (
                <span className={classes.workspaceIconContainer}>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'suggestCount' :
                        'suggestSearchCount' })}>
                      <Badge badgeContent={suggestCount} showZero>
                        <EmojiObjectsIcon
                          className={suggestCount === 0 ? classes.chipItemEmpty : classes.chipItemSuggestion}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'todoCount' :
                        'todoSearchCount' })}>
                      <Badge badgeContent={todoCount} showZero>
                        <AssignmentIcon
                          className={todoCount === 0 ? classes.chipItemEmpty : classes.chipItemTodo}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'questionCount' : 
                        'questionSearchCount' })}>
                      <Badge badgeContent={questionCount}>
                        <HelpIcon
                          className={questionCount === 0 ? classes.chipItemEmpty : classes.chipItemQuestion}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? 'issueCount' :
                        'issueSearchCount' })}>
                      <Badge badgeContent={issueCount} showZero>
                        <BlockIcon
                          className={issueCount === 0 ? classes.chipItemEmpty : classes.chipItemIssue}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                  <div className={classes.workspaceCommentsIcons}>
                    <Tooltip title={intl.formatMessage({ id: _.isEmpty(search) ? "storyCount" :
                      'storySearchCount' })}>
                      <Badge badgeContent={investiblesCount} showZero>
                        <WorkIcon
                          className={investiblesCount === 0 ? classes.chipItemEmpty : classes.chipItemStory}
                        />
                      </Badge>
                    </Tooltip>
                  </div>
                </span>
              )}
            </CardContent>
          </RaisedCard>
        </Grid>
      );
    });
  }

  return (
    <>
      <div className={classes.titleContainer} id="planningMarkets">
        {<PlaylistAddCheckIcon htmlColor="#333333"/>}
        <Typography className={classes.title} variant="h6">
          {intl.formatMessage({ id: 'homePlanningDialogs' })}
        </Typography>
      </div>
      <Grid container spacing={4}>
        {getMarketItems()}
      </Grid>
    </>
  );
}

PlanningDialogs.propTypes = {
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
  isArchives: PropTypes.bool,
};

PlanningDialogs.defaultProps = {
  isArchives: false,
};

export default PlanningDialogs;
