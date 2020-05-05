import React, { useContext } from 'react'
import { Avatar, CardActions, CardContent, Grid, Link, Tooltip, Typography } from '@material-ui/core'
import ThumbUpIcon from '@material-ui/icons/ThumbUp'
import ThumbDownIcon from '@material-ui/icons/ThumbDown'
import { AvatarGroup } from '@material-ui/lab'
import _ from 'lodash'
import { useHistory } from 'react-router'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { useIntl } from 'react-intl'
import { nameToAvatarText } from '../../utils/stringFunctions'
import clsx from 'clsx'
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import ProgressBar from '../../components/Expiration/ProgressBarExpiration'
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { getVoteTotalsForUser } from '../../utils/userFunctions'
import { ACTIVE_STAGE } from '../../constants/markets'
import DialogActions from './DialogActions'
import ExpiredDisplay from '../../components/Expiration/ExpiredDisplay'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'

const useStyles = makeStyles(() => ({
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
    marginLeft: '5px'
  },
  childText: {
    fontSize: '.825rem'
  },
  isLinked: {
    cursor: 'pointer',
  },
  chartContainer: {
    justifyContent: 'flex-end',
    paddingRight: '2rem'
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
  }
}));

function InitiativeDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const intl = useIntl();
  const { markets } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);

  function getParticipantInfo(presences) {

    return (
      <div style={{flex: 2, display: 'inline-block', height: '100%', borderRight: '1px solid #f2f2f2', minWidth: '70%'}}>
        <Grid
          container
          style={{height: '100%' }}
        >
          <Grid
            item
            xs={12}
            style={{alignSelf: 'center', display: 'flex', justifyContent: 'flex-end', paddingRight: '1rem'}}
          >
            <AvatarGroup
              max={4}
              spacing="small">
              {presences.map((presence) => {
                const { id: userId, name } = presence;
                return <Tooltip key={`tip${userId}`} title={name}><Avatar className={classes.green} key={userId}>{nameToAvatarText(name)}</Avatar></Tooltip>
                })
              }
            </AvatarGroup>
            </Grid> 
        </Grid>
      </div>
    );
  }

  function getMarketItems() {
    return markets.map((market) => {
      const {
        id: marketId, created_at: createdAt, expiration_minutes: expirationMinutes, created_by: createdBy,
        market_type: marketType, market_stage: marketStage, updated_at: updatedAt, parent_market_id: parentMarketId,
        parent_investible_id: parentInvestibleId,
      } = market;
      const investibles = getMarketInvestibles(investiblesState, marketId);
      if (!investibles || _.isEmpty(investibles)) {
        return <></>;
      }
      const baseInvestible = investibles[0];
      const { investible } = baseInvestible;
      const { name, id: investibleId } = investible;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following && !presence.market_banned);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const isAdmin = myPresence && myPresence.is_admin;
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      const active = marketStage === ACTIVE_STAGE;
      const creator = marketPresences.find(presence => {return presence.id === createdBy}) || {name: ''};
      const isSmall = true;
      const strippedInvestibles = investibles.map(inv => inv.investible);
      let parentName;
      if(parentMarketId){
        const parentMarketDetails = getMarket(marketsState, parentMarketId);
        parentName = parentMarketDetails.name;
      }
      function getInvestibleVotes() {
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
        return tallies;
      }
      const votes = getInvestibleVotes();
      const votesArray = Object.values(votes);
      // descending order of support
      const sortedVotesArray = _.sortBy(
        votesArray,
        'numSupporters',
        'name'
      ).reverse();
      const voting = [];
      sortedVotesArray.map((sortedVote) => sortedVote.investments.map((investment) => voting.push(investment)));
      
      const votesFor = voting.filter(vote => {return vote.y > 0 });
      const votesAgainst = voting.filter(vote => { return vote.y < 0});
      
      return (
        <Grid
          item
          key={marketId}
          xs={12}
          className={classes.lastChild}

        >
          <RaisedCard
            className={classes.paper}
            border={1}
          >
            <Grid container >
              <div className={classes.gridSliver}>
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
                className={classes.contentContainer}
              >
                <Grid container>
                  <Grid item xs={6}>
                    <CardContent>
                      {parentMarketId &&
                        <Link
                          href={formMarketLink(parentMarketId)}
                          variant="inherit"
                          underline="always"
                          color="primary"
                          onClick={
                            (event) => {
                              event.preventDefault();
                              event.stopPropagation();
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
                          event.preventDefault();
                          navigate(history, formInvestibleLink(marketId, investibleId));}}
                      >
                          {isDraft && (
                            <Typography
                              className={classes.draft}
                            >
                              {intl.formatMessage({ id: 'draft' })}
                            </Typography>
                          )}
                          <Typography variant="h6">
                              {name}
                          </Typography>
                      </div>
                      {getDialogTypeIcon(marketType, isSmall)}
                      <Typography className={classes.byline}>
                        {intl.formatMessage({id: 'homeInitiativeLabel'},
                          {x: creator.name, y: intl.formatDate(createdAt)})}
                      </Typography>
                  </CardContent>
                </Grid>
                <Grid item xs={2} container className={classes.chartContainer}>
                  <div className={classes.chartContent}>
                      <span className={classes.voteContainer}>{votesFor && votesFor.length}</span>
                      <ThumbUpIcon htmlColor="#828282" className={clsx(classes.thumbs, classes.spacer)}/>
                      <ThumbDownIcon htmlColor="#828282" className={classes.thumbs}/>
                      <span className={classes.voteContainer}>{votesAgainst && votesAgainst.length}</span>
                  </div>
                </Grid>
                <Grid item xs={4} style={{display: 'flex'}}>
                  {getParticipantInfo(sortedPresences)}
                  <CardActions style={{display: 'inline-block', flex: 5, alignSelf: 'center'}}>
                    <DialogActions
                      isAdmin={myPresence.is_admin}
                      isFollowing={myPresence.following}
                      marketStage={marketStage}
                      marketType={marketType}
                      parentMarketId={parentMarketId}
                      parentInvestibleId={parentInvestibleId}
                      marketId={marketId}
                      hideEdit={true}
                    />
                  </CardActions>
                </Grid>
              </Grid>
            </div>
          </Grid>
        </RaisedCard>
      </Grid>
      );
    });
  }

  return (
    <Grid container spacing={4}>
      {getMarketItems()}
    </Grid>
  );
}

InitiativeDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InitiativeDialogs;
