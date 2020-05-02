import React, { Fragment, useContext } from 'react'
import { Avatar, CardActions, CardContent, Grid, Link, Tooltip, Typography } from '@material-ui/core'
import _ from 'lodash'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/styles'
import { AvatarGroup } from '@material-ui/lab'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { nameToAvatarText } from '../../utils/stringFunctions'
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import { getInvestible, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import DialogActions from './DialogActions'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketInfo } from '../../utils/userFunctions'

const useStyles = makeStyles(() => ({
  paper: {
    textAlign: 'left',
    minHeight: '200px'
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
    marginTop: '12px'
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  upperRight: {
    textAlign: 'right',
    fontSize: '.825rem'
  },
  innerContainer: {
    borderBottom: '1px solid #f2f2f2',
    paddingTop: '1rem',
    paddingBottom: '2rem',
    marginBottom: '1rem',
    flex: 2,
    cursor: 'pointer'
  },
  bottomContainer: {
    display: 'flex',
    flex: 1,
    height: '50px'
  },
  draftContainer: {
    height: '50px'
  },
  participantContainer: {
    height: '50px',
    display: 'flex',
    width: '100%'
  },
  participantText: {
    fontSize: '.7rem'
  },
  childText: {
    fontSize: '.825rem'
  },
  lessPadding: {
    '&.MuiGrid-item': {
      padding: '10px'
    }
  }
}));

function PlanningDialogs(props) {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const { markets } = props;
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
              <AvatarGroup
                max={4}
                spacing="medium">
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

  function getInvestibleName(investibleId) {
    const inv = getInvestible(investibleState, investibleId);
    if (!inv) {
      return '';
    }
    const { investible } = inv;
    const { name } = investible;
    return name;
  }

  function getMarketUpdatedAt(updatedAt, marketPresences, investibles, comments, marketId) {
    let mostRecentUpdate = updatedAt;
    marketPresences.forEach((presence) => {
      const { investments } = presence;
      if (investments) {
        investments.forEach((investment) => {
          const { updated_at: investmentUpdatedAt } = investment;
          const fixed = new Date(investmentUpdatedAt);
          if (fixed > mostRecentUpdate) {
            mostRecentUpdate = fixed;
          }
        });
      }
    });
    investibles.forEach((fullInvestible) => {
      const { investible } = fullInvestible;
      const { updated_at: investibleUpdatedAt } = investible;
      let fixed = new Date(investibleUpdatedAt);
      if (fixed > mostRecentUpdate) {
        mostRecentUpdate = fixed;
      }
      const marketInfo = getMarketInfo(fullInvestible, marketId);
      const { updated_at: infoUpdatedAt } = marketInfo;
      fixed = new Date(infoUpdatedAt);
      if (fixed > mostRecentUpdate) {
        mostRecentUpdate = fixed;
      }
    });
    comments.forEach((comment) => {
      const { updated_at: commentUpdatedAt } = comment;
      const fixed = new Date(commentUpdatedAt);
      if (fixed > mostRecentUpdate) {
        mostRecentUpdate = fixed;
      }
    });
    return mostRecentUpdate;
  }

  function getMarketItems() {
    const marketsWithUpdatedAt = markets.map((market) => {
      const { id: marketId, updated_at: updatedAt } = market;
      const comments = getMarketComments(commentsState, marketId) || [];
      const investibles = getMarketInvestibles(investibleState, marketId) || [];
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const marketUpdatedAt = getMarketUpdatedAt(updatedAt, marketPresences, investibles, comments, marketId);
      return { ...market, marketUpdatedAt }
    });
    const sortedMarkets = _.sortBy(marketsWithUpdatedAt, 'marketUpdatedAt').reverse();
    return sortedMarkets.map((market) => {
      const {
        id: marketId, name, market_type: marketType, market_stage: marketStage,
        parent_market_id: parentMarketId, parent_investible_id: parentInvestibleId, marketUpdatedAt
      } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following && !presence.market_banned);
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      let parentName;
      if(parentInvestibleId){
        parentName = getInvestibleName(parentInvestibleId);
      }
      return (
        <Grid
          item
          key={marketId}
          xs={4}
          className={classes.lessPadding}
        >
          <RaisedCard
            className={classes.paper}
            border={1}
          >
            <Typography className={classes.upperRight}>
              {intl.formatMessage({ id: 'homeUpdated' }, { x: intl.formatDate(marketUpdatedAt) })}
            </Typography>
            <CardContent className={classes.cardContent}>
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
              <div className={classes.innerContainer}
                onClick={(event) => {
                event.preventDefault();
                navigate(history, formMarketLink(marketId));}
                }
              >
                <Typography 
                  variant="h5"
                >
                    {name}
                </Typography>
              </div>
              <div className={classes.bottomContainer}>
                {isDraft && (
                  <div className={classes.draftContainer}>
                    <Typography className={classes.draft}>
                      {intl.formatMessage({ id: 'draft' })}
                    </Typography>
                  </div>
                )}
                <Fragment>
                  <span className={classes.participantContainer}>
                    {!isDraft && getParticipantInfo(sortedPresences, marketId)}
                    <CardActions style={{display: 'inline-block', flex: 5}}>
                      <DialogActions
                        marketStage={marketStage}
                        marketId={marketId}
                        marketType={marketType}
                        parentMarketId={parentMarketId}
                        parentInvestibleId={parentInvestibleId}
                        isAdmin
                        isFollowing={myPresence.following}
                        hideEdit={true}
                      />
                    </CardActions>
                  </span>
                </Fragment>
              </div>
            </CardContent>
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

PlanningDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default PlanningDialogs;
