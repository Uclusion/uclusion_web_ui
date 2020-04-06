import React, { useContext } from 'react'
import { CardActions, CardContent, Grid, Link, Typography, } from '@material-ui/core'
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
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import RaisedCard from '../../components/Cards/RaisedCard'
import ExpiresDisplay from '../../components/Expiration/ExpiresDisplay'
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions'
import { getParticipantInfo } from '../../utils/userFunctions'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
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
}));

function DecisionDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const intl = useIntl();
  const { markets } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);

  function getMarketItems() {
    return markets.map((market) => {
      const {
        id: marketId, name, created_at: createdAt, expiration_minutes: expirationMinutes,
        market_type: marketType, market_stage: marketStage, updated_at: updatedAt, parent_market_id: parentMarketId,
        parent_investible_id: parentInvestibleId,
      } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const isAdmin = myPresence && myPresence.is_admin;
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following);
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      const marketInvestibles = getMarketInvestibles(investiblesState, marketId);
      const active = marketStage === ACTIVE_STAGE;
      const comments = getMarketComments(commentsState, marketId);
      const marketIssues = comments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved && !comment.investible_id);
      const hasMarketIssue = !_.isEmpty(marketIssues);
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
            <CardContent>
              <Grid
                container
              >
                <Grid
                  item
                  xs={3}
                >
                  {getDialogTypeIcon(marketType)}
                </Grid>
              </Grid>
              <div>
                {isDraft && (
                  <Typography
                    className={classes.draft}
                  >
                    {intl.formatMessage({ id: 'draft' })}
                  </Typography>
                )}
                <Typography>
                  <Link
                    href={formMarketLink(marketId)}
                    variant="inherit"
                    underline="always"
                    color="primary"
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(history, formMarketLink(marketId));
                    }}
                  >
                    {name}
                  </Link>
                </Typography>
              </div>
              <Typography>
                {intl.formatMessage({ id: 'homeCreatedAt' }, { dateString: intl.formatDate(createdAt) })}
              </Typography>
              <Grid
                container
              >
                <Grid
                  item
                  xs={3}
                >
                  {!active && (
                    <ExpiredDisplay expiresDate={updatedAt}/>
                  )}
                  {active && (
                    <ExpiresDisplay
                      createdAt={createdAt}
                      expirationMinutes={expirationMinutes}
                      showEdit={isAdmin}
                      history={history}
                      marketId={marketId}
                    />
                  )}
                </Grid>
                <Grid
                  item
                  xs={9}
                >
                  {getParticipantInfo(sortedPresences, marketInvestibles)}
                </Grid>
              </Grid>
              {hasMarketIssue && (
                <CardType className={classes.commentType} type={ISSUE_TYPE}/>
              )}
            </CardContent>
            <CardActions>
              <DialogActions
                isAdmin={myPresence.is_admin}
                isFollowing={myPresence.following}
                marketStage={marketStage}
                marketType={marketType}
                parentMarketId={parentMarketId}
                parentInvestibleId={parentInvestibleId}
                marketId={marketId}
              />
            </CardActions>
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
