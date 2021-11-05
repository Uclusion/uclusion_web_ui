import React, { useContext } from 'react'
import { CardActions, CardContent, Grid, Link, Typography, useMediaQuery, useTheme } from '@material-ui/core'
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
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { formInvestibleLink, formMarketLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import ProgressBar from '../../components/Expiration/ProgressBarExpiration'
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions'
import { ACTIVE_STAGE } from '../../constants/markets'
import DialogActions from './DialogActions'
import ExpiredDisplay from '../../components/Expiration/ExpiredDisplay'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import {
  getInvestibleName,
  getMarketInvestibles
} from '../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketUpdatedAt, getVoteTotalsForUser } from '../../utils/userFunctions'
import { ISSUE_TYPE } from '../../constants/comments'
import CardType from '../../components/CardType'
import Chart from '../../components/Cards/Chart'
import ThumbUpIcon from '@material-ui/icons/ThumbUp'
import clsx from 'clsx'
import ThumbDownIcon from '@material-ui/icons/ThumbDown'
import GravatarGroup from '../../components/Avatars/GravatarGroup';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import GavelIcon from '@material-ui/icons/Gavel'
import PollIcon from '@material-ui/icons/Poll'

const dialogStyles = makeStyles((theme) => ({
  paper: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },
  draft: {
    color: '#E85757',
  },
  countdownContainer: {
    width: 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
  },
  gridSliver: {
    maxWidth: '3.3%',
    flexBasis: '3.3%'
  },
  green: {
    backgroundColor: '#3f6b72',
  },
  contentContainer: {
    flexGrow: 0,
    maxWidth: '96%',
    flexBasis: '96%',
  },
  byline: {
    display: 'inline-block',
    width: 'auto',
    verticalAlign: 'top',
    marginLeft: '5px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '.75rem',
      marginLeft: 0
    },
  },
  childText: {
    fontSize: '.825rem'
  },
  isLinked: {
    cursor: 'pointer',
  },
  borderRight: {
    borderRight: '1px solid #f2f2f2',
    [theme.breakpoints.down('sm')]: {
      borderRight: 'none'
    },
  },
  chartContainer: {
    justifyContent: 'flex-end',
    paddingRight: '2rem',
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'flex-start',
      paddingRight: 0,
      paddingLeft: '1rem'
    },
  },
  cardContent: {
    [theme.breakpoints.down('sm')]: {
      '&:last-child':{
        paddingBottom: 0
      }
    },
  },
  chartContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '-75%',
  },
  chartValue: {
    backgroundColor: '#3f6b72',
    color: '#ffffff',
    padding: '3px 10px',
    borderRadius: '12px',
    fontWeight: '900',
    marginTop: '5px',
  },
  lastChild: {
    '&.MuiGrid-item': {
      padding: '10px',
    },
    '&:last-child': {
      marginBottom: '16px'
    }
  },
  mobileExpired: {
    maxWidth: '100%',
    flexBasis: '100%'
  },
  expiredContentContainer: {
    flexGrow: 0,
    maxWidth: '100%',
    flexBasis: '100%',
  }
}));

const initiativeStyles = makeStyles((theme) => ({
  paper: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },
  draft: {
    color: '#E85757',
  },
  green: {
    backgroundColor: '#3f6b72',
  },
  countdownContainer: {
    width: 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
  },
  gridSliver: {
    maxWidth: '3.3%',
    flexBasis: '3.3%'
  },
  contentContainer: {
    flexGrow: 0,
    maxWidth: '96%',
    flexBasis: '96%',
  },
  byline: {
    display: 'inline-block',
    width: 'auto',
    verticalAlign: 'top',
    marginLeft: '5px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '.75rem',
      marginLeft: 0
    },
  },
  borderRight: {
    borderRight: '1px solid #f2f2f2',
    [theme.breakpoints.down('sm')]: {
      borderRight: 'none'
    },
  },
  childText: {
    fontSize: '.825rem'
  },
  isLinked: {
    cursor: 'pointer',
  },
  chartContainer: {
    justifyContent: 'flex-end',
    paddingRight: '2rem',
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'flex-start',
      paddingRight: 0,
      paddingLeft: '1rem'
    },
  },
  cardContent: {
    [theme.breakpoints.down('sm')]: {
      '&:last-child':{
        paddingBottom: 0
      }
    },
  },
  chartContent: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '-75%',
  },
  voteContainer: {
    fontWeight: '900',
    margin: '.375rem',
    fontSize: '1.2rem'
  },
  thumbs: {
    fontSize: '1.25rem',
    position: 'relative',
    top: '-2px'
  },
  spacer: {
    marginRight: '.5rem;'
  },
  lastChild: {
    '&.MuiGrid-item': {
      padding: '10px',
    },
    '&:last-child': {
      marginBottom: '16px'
    }
  },
  mobileExpired: {
    maxWidth: '100%',
    flexBasis: '100%'
  },
  expiredContentContainer: {
    flexGrow: 0,
    maxWidth: '100%',
    flexBasis: '100%',
  },
  titleContainer: {
    width: 'auto',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem'
  },
}));

function InitiativesAndDialogs(props) {
  const history = useHistory();
  const dialogClasses = dialogStyles();
  const initiativeClasses = initiativeStyles();
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { dialogs, initiatives, workspaces, showParentOf, isSectionOpen } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  
  function getParticipantInfo(presences, classes) {

    return (
      <div className={classes.borderRight} style={{flex: 2, display: 'inline-block', height: '100%', minWidth: '70%'}}>
        <Grid
          container
          style={{height: '100%' }}
        >
          <Grid
            item
            xs={12}
            style={{alignSelf: 'center', display: 'flex', justifyContent: 'flex-end', paddingRight: '1rem'}}
          >
            <GravatarGroup
              max={!mobileLayout ? 4 : 2}
              spacing="small"
              users={presences}
            />
            </Grid> 
        </Grid>
      </div>
    );
  }

  function getInvestibleVotes(investibles, marketPresences) {
    const strippedInvestibles = investibles.map(inv => inv.investible);

    // first set every investibles support and investments to 0
    const tallies = strippedInvestibles.reduce((acc, inv) => {
      const { id } = inv;
      acc[id] = {
        ...inv,
        investments: [],
        numSupporters: 0
      };
      return acc;
    }, {});
    // now we fill in votes from market presences
    marketPresences.forEach(presence => {
      const userInvestments = getVoteTotalsForUser(presence);
      Object.keys(userInvestments).forEach((investible_id) => {
        const oldValue = tallies[investible_id];
        if (oldValue) {
          const newInvestments = [
            ...oldValue.investments,
            userInvestments[investible_id],
          ];
          tallies[investible_id] = {
            ...oldValue,
            investments: newInvestments,
            numSupporters: newInvestments.length,
          };
        }
      });
    });
    Object.keys(tallies).forEach((investibleId) => {
      if (tallies[investibleId].numSupporters === 0) {
        delete tallies[investibleId];
      }
    });
    return tallies;
  }

  function getDialogItems() {
    const classes = dialogClasses;
    const useDialogs = _.isEmpty(dialogs) ? workspaces : dialogs;
    const unsortedResults = useDialogs.map((market) => {
      const {
        id: marketId, name, created_at: createdAt, expiration_minutes: expirationMinutes, created_by: createdBy,
        market_type: marketType, market_stage: marketStage, updated_at: updatedAt, parent_market_id: parentMarketId,
        parent_investible_id: parentInvestibleId, invite_capability: marketToken, isNotCollaborator
      } = market;
      
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(messagesState, marketId);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const isAdmin = myPresence && myPresence.is_admin;
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following && !presence.market_banned);
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      const active = marketStage === ACTIVE_STAGE;
      const comments = getMarketComments(commentsState, marketId) || [];
      const marketIssues = comments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved && !comment.investible_id);
      const hasMarketIssue = !_.isEmpty(marketIssues);
      const creator = sortedPresences.find((presence) => (presence.id === createdBy)) || {name: ''};
      const isSmall = true;
      const investibles = getMarketInvestibles(investiblesState, marketId);
      const marketUpdatedAt = getMarketUpdatedAt(updatedAt, marketPresences, investibles, comments, marketId);

      const votes = getInvestibleVotes(investibles, marketPresences);
      const votesArray = Object.values(votes);
      // descending order of support
      const sortedVotesArray = _.sortBy(
        votesArray,
        'numSupporters',
        'name'
      ).reverse();
      const chartData = [];
      sortedVotesArray.map((sortedVote) => sortedVote.investments.map((investment) => chartData.push(investment)));
      let parentName;
      if (parentInvestibleId) {
        parentName = getInvestibleName(parentInvestibleId, investibleState);
      } else if (parentMarketId) {
        const parentMarketDetails = getMarket(marketsState, parentMarketId) || {};
        parentName = parentMarketDetails.name;
      }
      const item =
        <RaisedCard className={classes.paper} elevation={3}>
          <Grid container >
            <div className={active ? classes.gridSliver : classes.mobileExpired}>
              <div className={classes.countdownContainer}>
                {!active && (
                  <ExpiredDisplay expiresDate={updatedAt}/>
                )}
                {active && expirationMinutes && (
                  <ProgressBar
                    createdAt={createdAt}
                    expirationMinutes={expirationMinutes}
                    showEdit={isAdmin}
                    history={history}
                    marketId={marketId}
                  />
                )}
              </div>
            </div>

            <div
              className={active ? classes.contentContainer : classes.expiredContentContainer}
            >
              <Grid container>
                <Grid item xs={12} md={6}>
                  <CardContent className={classes.cardContent}>
                    {parentName && showParentOf &&
                      <Link
                        href={formMarketLink(parentMarketId)}
                        variant="inherit"
                        underline="always"
                        color="primary"
                        onClick={
                          (event) => {
                            preventDefaultAndProp(event);
                            navigate(history, formMarketLink(parentMarketId));
                          }
                        }
                      >
                        <Typography className={classes.childText}>
                          Child of {parentName}
                        </Typography>
                      </Link>
                    }
                    <div
                      className={classes.isLinked}
                      onClick={(event) => {
                        preventDefaultAndProp(event);
                        navigate(history, isNotCollaborator ? `/invite/${marketToken}` :
                          formMarketLink(marketId));
                      }}>
                      {isDraft && (
                        <Typography
                          className={classes.draft}
                        >
                          {intl.formatMessage({ id: 'draft' })}
                        </Typography>
                      )}
                      <Typography variant={!mobileLayout ? 'h6' : 'body1'}>
                        {name}
                      </Typography>
                    </div>
                    {!mobileLayout ? getDialogTypeIcon(marketType, isSmall) : <span/>}
                    {!_.isEmpty(dialogs) && (
                      <Typography className={classes.byline}>
                        {intl.formatMessage({id: 'homeDialogLabel'},
                          {x: creator.name, y: intl.formatDate(marketUpdatedAt)})}
                      </Typography>
                    )}
                    {_.isEmpty(dialogs) && (
                      <Typography className={classes.byline}>
                        {intl.formatMessage({id: 'initiativeWorkspaceLabel'},
                          {x: intl.formatDate(marketUpdatedAt)})}
                      </Typography>
                    )}
                    {hasMarketIssue && (
                      <CardType className={classes.commentType} type={ISSUE_TYPE}/>
                    )}
                  </CardContent>
                </Grid>
                <Grid item xs={6} md={2} container className={classes.chartContainer}>
                  <div className={classes.chartContent}>
                    <Chart data={chartData} />
                    <span className={classes.chartValue}>
                          {intl.formatMessage({ id: 'numVoting' }, { x: chartData.length })}
                    </span>
                  </div>
                </Grid>
                {isNotCollaborator && (
                  <Typography className={classes.byline}>
                    {intl.formatMessage({id: 'dialogNotParticipating'})}
                  </Typography>
                )}
                {!_.isEmpty(myPresence) && (
                  <Grid item md={4} xs={5} style={{ display: 'flex' }}>
                    {getParticipantInfo(sortedPresences, classes)}
                    {!mobileLayout && (
                      <CardActions style={{ display: 'inline-block', flex: 5, alignSelf: 'center' }}>
                        <DialogActions
                          isAdmin={myPresence.is_admin}
                          isFollowing={myPresence.following}
                          marketStage={marketStage}
                          marketType={marketType}
                          marketPresences={marketPresences}
                          parentMarketId={parentMarketId}
                          parentInvestibleId={parentInvestibleId}
                          marketId={marketId}
                          hideEdit={true}
                        />
                      </CardActions>
                    )}
                  </Grid>
                )}
              </Grid>
            </div>
          </Grid>
        </RaisedCard>;
      return {marketUpdatedAt, item, marketId};
    });

    const sortedDialogItems = _.sortBy(unsortedResults, 'marketUpdatedAt').reverse();
    return sortedDialogItems.map((fullItem, index) => {
      const { item, marketId } = fullItem;
      return (
        <Grid
          item
          id={`dia${index}`}
          key={marketId}
          xs={12}
          className={classes.lastChild}
        >
          {item}
        </Grid>
      );
    });
  }

  function getInitiativeItems() {
    const classes = initiativeClasses;
    const unsortedInitiatives = initiatives.map((market, index) => {
      const {
        id: marketId, created_at: createdAt, expiration_minutes: expirationMinutes, created_by: createdBy,
        market_type: marketType, market_stage: marketStage, updated_at: updatedAt, parent_market_id: parentMarketId,
        parent_investible_id: parentInvestibleId,
      } = market;
      const investibles = getMarketInvestibles(investiblesState, marketId);
      const baseInvestible = investibles[0];
      if (!baseInvestible) {
        console.warn(`Missing investible for market id ${marketId}`);
        return React.Fragment;
      }
      const { investible } = baseInvestible;
      const { name, id: investibleId } = investible;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(messagesState, marketId);
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following && !presence.market_banned);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const isAdmin = myPresence && myPresence.is_admin;
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      const active = marketStage === ACTIVE_STAGE;
      const creator = marketPresences.find(presence => {return presence.id === createdBy}) || {name: ''};
      const isSmall = true;
      let parentName;
      if(parentMarketId){
        const parentMarketDetails = getMarket(marketsState, parentMarketId);
        parentName = parentMarketDetails.name;
      }
      const comments = getMarketComments(commentsState, marketId) || [];
      const marketUpdatedAt = getMarketUpdatedAt(updatedAt, marketPresences, investibles, comments, marketId);
      const votes = getInvestibleVotes(investibles, marketPresences);
      const votesArray = Object.values(votes);
      // descending order of support
      const sortedVotesArray = _.sortBy(
        votesArray,
        'numSupporters',
        'name'
      ).reverse();
      const voting = [];
      sortedVotesArray.forEach((sortedVote) => sortedVote.investments.forEach((investment) => voting.push(investment)));

      const votesFor = voting.filter(vote => {return vote.y > 0 });
      const votesAgainst = voting.filter(vote => { return vote.y < 0});
      const item =
        <RaisedCard
          className={classes.paper}
          elevation={3}
        >
          <Grid container >
            <div className={active ? classes.gridSliver : classes.mobileExpired}>
              <div className={classes.countdownContainer}>
                {!active && (
                  <ExpiredDisplay expiresDate={updatedAt}/>
                )}
                {active && (
                  <ProgressBar
                    createdAt={createdAt}
                    expirationMinutes={expirationMinutes}
                    showEdit={isAdmin}
                    history={history}
                    marketId={marketId}
                  />
                )}
              </div>
            </div>

            <div
              className={active ? classes.contentContainer : classes.expiredContentContainer}
            >
              <Grid container>
                <Grid item xs={12} md={6}>
                  <CardContent>
                    {parentMarketId &&
                    <Link
                      href={formMarketLink(parentMarketId)}
                      variant="inherit"
                      underline="always"
                      color="primary"
                      onClick={
                        (event) => {
                          preventDefaultAndProp(event);
                          navigate(history, formMarketLink(parentMarketId));
                        }
                      }
                    >
                      <Typography className={classes.childText}>
                        Child of {parentName}
                      </Typography>
                    </Link>
                    }
                    <div
                      className={classes.isLinked}
                      onClick={(event) => {
                        preventDefaultAndProp(event);
                        navigate(history, formInvestibleLink(marketId, investibleId));}}
                    >
                      {isDraft && (
                        <Typography
                          className={classes.draft}
                        >
                          {intl.formatMessage({ id: 'draft' })}
                        </Typography>
                      )}
                      <Typography variant={!mobileLayout ? 'h6' : 'body1'}>
                        {name}
                      </Typography>
                    </div>
                    {!mobileLayout ? getDialogTypeIcon(marketType, isSmall) : <span/>}
                    <Typography className={classes.byline}>
                      {intl.formatMessage({id: 'homeInitiativeLabel'},
                        {x: creator.name, y: intl.formatDate(marketUpdatedAt)})}
                    </Typography>
                  </CardContent>
                </Grid>
                <Grid item md={2} xs={6} container className={classes.chartContainer}>
                  <div className={classes.chartContent}>
                    <span className={classes.voteContainer}>{votesFor && votesFor.length}</span>
                    <ThumbUpIcon htmlColor="#828282" className={clsx(classes.thumbs, classes.spacer)}/>
                    <ThumbDownIcon htmlColor="#828282" className={classes.thumbs}/>
                    <span className={classes.voteContainer}>{votesAgainst && votesAgainst.length}</span>
                  </div>
                </Grid>
                <Grid item xs={5} md={4} style={{display: 'flex'}}>
                  {getParticipantInfo(sortedPresences, classes)}
                  {!mobileLayout && ( 
                    <CardActions style={{display: 'inline-block', flex: 5, alignSelf: 'center'}}>
                      <DialogActions
                        isAdmin={myPresence.is_admin}
                        isFollowing={myPresence.following}
                        marketStage={marketStage}
                        marketType={marketType}
                        marketPresences={marketPresences}
                        parentMarketId={parentMarketId}
                        parentInvestibleId={parentInvestibleId}
                        marketId={marketId}
                        hideEdit={true}
                      />
                    </CardActions>
                  )}
                </Grid>
              </Grid>
            </div>
          </Grid>
        </RaisedCard>;

      return {marketUpdatedAt, item, marketId};
    });
    const sortedInitiatives = _.sortBy(unsortedInitiatives, 'marketUpdatedAt').reverse();
    return sortedInitiatives.map((fullItem, index) => {
      const { item, marketId } = fullItem;
      return (
        <Grid
          item
          id={`ini${index}`}
          key={marketId}
          xs={12}
          className={classes.lastChild}
        >
          {item}
        </Grid>
      );
    });
  }

  return (
    <>
      <div id="dialogs"
           style={{ display: isSectionOpen('dialogs') ? 'block' : 'none', paddingBottom: '3rem' }}>
        <div className={initiativeClasses.titleContainer}>
          {<GavelIcon htmlColor="#333333"/>}
          <Typography style={{marginLeft: '1rem'}} variant="h6">
            {intl.formatMessage({ id: 'dialogs' })}
          </Typography>
        </div>
        <Grid container spacing={4}>
          {getDialogItems()}
        </Grid>
      </div>
      <div id="initiatives"
           style={{ display: isSectionOpen('initiatives') ? 'block' : 'none' }}>
        <div className={initiativeClasses.titleContainer}>
          {<PollIcon htmlColor="#333333"/>}
          <Typography style={{marginLeft: '1rem'}} variant="h6">
            {intl.formatMessage({ id: 'initiatives' })}
          </Typography>
        </div>
        <Grid container spacing={4}>
          {getInitiativeItems()}
        </Grid>
      </div>
    </>
  );
}

InitiativesAndDialogs.propTypes = {
  dialogs: PropTypes.arrayOf(PropTypes.object),
  initiatives: PropTypes.arrayOf(PropTypes.object),
  workspaces: PropTypes.arrayOf(PropTypes.object),
  showParentOf: PropTypes.bool,
  isSectionOpen: PropTypes.func,
};

InitiativesAndDialogs.defaultProps = {
  showParentOf: true,
  dialogs: [],
  initiatives: [],
  workspaces: [],
  isSectionOpen: () => true
};

export default InitiativesAndDialogs;
