import React, { useContext } from 'react'
import { CardActions, CardContent, Grid, Link, Typography, Avatar } from '@material-ui/core'
import { AvatarGroup } from '@material-ui/lab'
import _ from 'lodash'
import { useHistory } from 'react-router'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { useIntl } from 'react-intl'
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import {
  getAcceptedStage,
  getBlockedStage,
  getInCurrentVotingStage,
  getInReviewStage,
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import ProgressBar from '../../components/Expiration/ProgressBarExpiration'
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { getParticipantInfo } from '../../utils/userFunctions'
import { ACTIVE_STAGE, INITIATIVE_TYPE } from '../../constants/markets'
import DialogActions from './DialogActions'
import ExpiredDisplay from '../../components/Expiration/ExpiredDisplay'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'

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
    cursor: 'pointer'
  },
  byline: {
    display: 'inline-block',
    width: 'auto',
    verticalAlign: 'top',
    marginLeft: '5px'
  },
  childText: {
    fontSize: '.825rem'
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
  const [marketStagesState] = useContext(MarketStagesContext);

  function getParticipantInfo(presences, marketId) {
    const marketInvestibles = getMarketInvestibles(investiblesState, marketId);
    const votingStage = getInCurrentVotingStage(marketStagesState, marketId);
    const acceptedStage = getAcceptedStage(marketStagesState, marketId);
    const reviewStage = getInReviewStage(marketStagesState, marketId);
    const blockedStage = getBlockedStage(marketStagesState, marketId);
    const loaded = votingStage && acceptedStage && reviewStage;

      return (
        <div style={{flex: 3, display: 'inline-block', height: '100%', borderRight: '1px solid #f2f2f2'}}>
          <Grid
            container
            style={{height: '100%'}}
          >
            <Grid
              item
              xs={12}
              style={{alignSelf: 'center'}}
            >
              <AvatarGroup
                max={4}
                spacing="medium">
                {presences.map((presence) => {
                  const { id: userId, name } = presence;
                  const splitName = name.split(' ');
                  return <Avatar key={userId}>{`${splitName[0].charAt(0)}${splitName[1]?splitName[1].charAt(0):''}`}</Avatar>
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
      const { name, id: baseInvestibleId } = investible;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following && !presence.market_banned);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const isAdmin = myPresence && myPresence.is_admin;
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      const marketInvestibles = getMarketInvestibles(investiblesState, marketId);
      const active = marketStage === ACTIVE_STAGE;
      const creator = sortedPresences.filter(presence => {return presence.id === createdBy})[0];
      const isSmall = true;
      let parentName;
      if(parentMarketId){
        const parentMarketDetails = getMarket(marketsState, parentMarketId);
        parentName = parentMarketDetails.name;
      }
      return (
        <Grid
          item
          key={marketId}
          xs={12}

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

              <div className={classes.contentContainer}>
                <Grid container>
                  <Grid xs={10}>
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
                        onClick={(event) => {
                        event.preventDefault();
                        navigate(history, formMarketLink(marketId));}}>
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
                        Initiative by {creator.name} on {intl.formatDate(createdAt)}
                      </Typography>
                  </CardContent>
                </Grid>
                <Grid xs={2} style={{display: 'flex'}}>
                  {getParticipantInfo(sortedPresences, marketId)}
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
