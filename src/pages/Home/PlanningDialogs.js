import React, { Fragment, useContext } from 'react'
import { Avatar, CardActions, CardContent, Grid, Link, Typography } from '@material-ui/core'
import _ from 'lodash'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/styles'
import { AvatarGroup } from '@material-ui/lab'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import DialogActions from './DialogActions'

const useStyles = makeStyles(() => ({
  paper: {
    textAlign: 'left',
    minHeight: '275px'
  },
  textData: {
    fontSize: 12,
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
    height: '100%'
  },
  innerContainer: {
    borderBottom: '1px solid #f2f2f2',
    paddingTop: '2rem',
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
    fontSize: '.75rem'
  },
  childText: {
    fontSize: '.825rem'
  }
}));

function PlanningDialogs(props) {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const { markets } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investibleState] = useContext(InvestiblesContext);
  
  function getParticipantInfo(presences) {

      return (
        <div style={{flex: 7}}>
          <Typography className={classes.participantText}>Participants</Typography>
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

  function getInvestibleName(investibleId) {
    const inv = getInvestible(investibleState, investibleId);
    if (!inv) {
      return '';
    }
    const { investible } = inv;
    const { name } = investible;
    return name;
  }

  function getMarketItems() {
    return markets.map((market) => {
      const {
        id: marketId, name, market_type: marketType, market_stage: marketStage,
        parent_market_id: parentMarketId, parent_investible_id: parentInvestibleId,
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

        >
          <RaisedCard
            className={classes.paper}
            border={1}
          >
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
                {!isDraft &&
                  <Fragment>
                    <span className={classes.participantContainer}>
                      {getParticipantInfo(sortedPresences, marketId)}
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
                }
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
