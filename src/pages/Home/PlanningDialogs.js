import React, { useContext } from 'react'
import { CardActions, CardContent, Grid, Link, Tooltip, Typography } from '@material-ui/core'
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
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import {
  getInvestibleName,
  getMarketInvestibles
} from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import DialogActions from './DialogActions'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketUpdatedAt } from '../../utils/userFunctions'
import { ACTIVE_STAGE } from '../../constants/markets'
import InvestiblesByWorkspace from '../Dialog/Planning/InvestiblesByWorkspace'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments'
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects'
import Badge from '@material-ui/core/Badge'
import BlockIcon from '@material-ui/icons/Block'
import HelpIcon from '@material-ui/icons/Help'
import AssignmentIcon from '@material-ui/icons/Assignment'
import GravatarGroup from '../../components/Avatars/GravatarGroup';
import { doRemoveEdit, doShowEdit } from '../Dialog/Planning/userUtils'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined'

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
  draft: {
    color: '#E85757',
    backgroundColor: '#ffc4c4',
    padding: '.5rem 1rem',
    border: '1px solid #E85757',
    borderRadius: '32px',
    fontSize: '.825rem',
    lineHeight: 2,
    marginTop: '12px',
    marginRight: '90px'
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
    flex: 1,
  },
  draftContainer: {
    height: '50px',
  },
  participantContainer: {
    height: '50px',
    display: 'flex',
    width: '100%',
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
  workspaceCommentsIcons: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '0.5rem',
    '& > *': {
      marginBottom: theme.spacing(2),
    },
    '& .MuiBadge-root': {
      marginRight: theme.spacing(2),
    },
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
}));

function PlanningDialogs(props) {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const { markets, isArchives } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  
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

  function getMarketItems() {
    const marketsWithUpdatedAt = markets.map((market) => {
      const { id: marketId, updated_at: updatedAt } = market;
      const comments = getMarketComments(commentsState, marketId) || [];
      const marketLevelUnresolved = comments.filter((comment) => !comment.resolved && !comment.investible_id);
      const issueCount = getCommentsCount(marketLevelUnresolved, ISSUE_TYPE);
      const questionCount = getCommentsCount(marketLevelUnresolved, QUESTION_TYPE);
      const suggestCount = getCommentsCount(marketLevelUnresolved, SUGGEST_CHANGE_TYPE);
      const todoCount = getCommentsCount(marketLevelUnresolved, TODO_TYPE);
      const investibles = getMarketInvestibles(investibleState, marketId) || [];
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const marketUpdatedAt = getMarketUpdatedAt(updatedAt, marketPresences, investibles, comments, marketId);
      return { ...market, marketUpdatedAt, questionCount, issueCount, suggestCount, todoCount }
    });
    const sortedMarkets = _.sortBy(marketsWithUpdatedAt, 'marketUpdatedAt').reverse();
    return sortedMarkets.map((market, index) => {
      const {
        id: marketId, name, market_type: marketType, market_stage: marketStage,
        parent_market_id: parentMarketId, parent_investible_id: parentInvestibleId, marketUpdatedAt, questionCount,
        issueCount, suggestCount, todoCount
      } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
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
          onMouseOver={() => doShowEdit(marketId)} onMouseOut={() => doRemoveEdit(marketId)}
        >
          <RaisedCard
            className={classes.paper}
            elevation={1}
          >
            <Grid container>
              <Grid item xs={11} style={{pointerEvents: 'none'}}>
                <Typography className={classes.upperLeft}>
                  {intl.formatMessage({ id: updatedMessageId }, { x: intl.formatDate(marketUpdatedAt) })}
                </Typography>
              </Grid>
              <Grid id={`showEdit0${marketId}`} item xs={1} style={{pointerEvents: 'none', display: 'none'}}>
                <EditOutlinedIcon style={{maxHeight: '1.25rem'}} />
              </Grid>
            </Grid>
            <CardContent id={`showEdit1${marketId}`} className={classes.cardContent} style={{paddingTop: '0.5rem'}}>
            {parentMarketId &&
              <Link
                href={formInvestibleLink(parentMarketId, parentInvestibleId)}
                variant="inherit"
                underline="always"
                color="primary"
                onClick={
                  (event) => {
                    event.preventDefault();
                    navigate(history, formInvestibleLink(parentMarketId, parentInvestibleId));
                  }
                }
              >
                <Typography className={classes.childText}>
                  {intl.formatMessage({ id: 'homeChildLinkName' }, { x: parentName })}
                </Typography>
            </Link>
              }
              <div className={window.outerWidth > 600 ? classes.innerContainer : classes.innerContainerMobile}
                onClick={(event) => {
                event.preventDefault();
                navigate(history, formMarketLink(marketId));}
                }
              >
                <Typography 
                  variant={window.outerWidth > 600 ? 'h5' : 'h6'}
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
                    <div className={classes.workspaceCommentsIcons}>
                      <div>
                        {suggestCount > 0 && (
                          <Tooltip title={intl.formatMessage({ id: "suggestCount" })}>
                            <Badge badgeContent={suggestCount}>
                              <EmojiObjectsIcon className={classes.chipItemSuggestion} />
                            </Badge>
                          </Tooltip>
                        )}
                        {todoCount > 0 && (
                          <Tooltip title={intl.formatMessage({ id: "todoCount" })}>
                            <Badge badgeContent={todoCount}>
                              <AssignmentIcon className={classes.chipItemTodo} />
                            </Badge>
                          </Tooltip>
                        )}
                      </div>
                      <div>
                        {questionCount > 0 && (
                          <Tooltip title={intl.formatMessage({ id: "questionCount" })}>
                            <Badge badgeContent={questionCount}>
                              <HelpIcon className={classes.chipItemQuestion} />
                            </Badge>
                          </Tooltip>
                        )}
                        {issueCount > 0 && (
                          <Tooltip title={intl.formatMessage({ id: "issueCount" })}>
                            <Badge badgeContent={issueCount}>
                              <BlockIcon className={classes.chipItemIssue} />
                            </Badge>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <CardActions style={{display: 'inline-block', flex: 5}}>
                      <DialogActions
                        marketStage={marketStage}
                        marketId={marketId}
                        marketType={marketType}
                        parentMarketId={parentMarketId}
                        parentInvestibleId={parentInvestibleId}
                        isAdmin
                        isFollowing={myPresence.following}
                        isGuest={myPresence.market_guest}
                        hideEdit={true}
                      />
                    </CardActions>
                  </span>
              </div>
            </CardContent>
          </RaisedCard>
        </Grid>
      );
    });
  }

  return (
    <>
      {!isArchives && (
        <>
          <div id="swimLanes">
            <InvestiblesByWorkspace workspaces={markets} />
          </div>
          <hr className={classes.spacer}/>
        </>
      )}
      <Grid container spacing={4} id="planningMarkets">
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
