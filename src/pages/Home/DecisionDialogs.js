import React, { useContext } from 'react'
import { AvatarGroup } from '@material-ui/lab'
import { Avatar, CardActions, CardContent, Grid, Link, Typography } from '@material-ui/core'
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
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import ProgressBar from '../../components/Expiration/ProgressBarExpiration'
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions'
import { ACTIVE_STAGE } from '../../constants/markets'
import DialogActions from './DialogActions'
import ExpiredDisplay from '../../components/Expiration/ExpiredDisplay'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { ISSUE_TYPE } from '../../constants/comments'
import CardType from '../../components/CardType'

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

function DecisionDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const intl = useIntl();
  const { markets } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  
  function getParticipantInfo(presences) {

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
        id: marketId, name, created_at: createdAt, expiration_minutes: expirationMinutes, created_by: createdBy,
        market_type: marketType, market_stage: marketStage, updated_at: updatedAt, parent_market_id: parentMarketId,
        parent_investible_id: parentInvestibleId,
      } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const isAdmin = myPresence && myPresence.is_admin;
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following && !presence.market_banned);
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      const active = marketStage === ACTIVE_STAGE;
      const comments = getMarketComments(commentsState, marketId);
      const marketIssues = comments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved && !comment.investible_id);
      const hasMarketIssue = !_.isEmpty(marketIssues);
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
                        Dialog by {creator.name} on {intl.formatDate(createdAt)}
                      </Typography>
                      {hasMarketIssue && (
                        <CardType className={classes.commentType} type={ISSUE_TYPE}/>
                      )}
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
      )
        ;
    });
  }

  return (
    <Grid container spacing={4}>
      {getMarketItems()}
    </Grid>
  );
}

DecisionDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DecisionDialogs;
