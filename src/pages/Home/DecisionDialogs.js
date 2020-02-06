import React, { useContext } from 'react';
import {
  Grid, Typography, CardContent, CardActions, Link,
} from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, formMarketManageLink, navigate } from '../../utils/marketIdPathFunctions';
import RaisedCard from '../../components/Cards/RaisedCard';
import ExpiresDisplay from '../../components/Expiration/ExpiresDisplay';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { getParticipantInfo } from '../../utils/userFunctions';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { ACTIVE_STAGE } from '../../constants/markets';
import DialogActions from './DialogActions';
import ExpiredDisplay from '../../components/Expiration/ExpiredDisplay';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { ISSUE_TYPE } from '../../constants/comments'
import { CommentType } from '../../components/Comments/Comment'

const useStyles = makeStyles(() => ({
  paper: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
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
        market_type: marketType, market_stage: marketStage, updated_at: updatedAt,
      } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
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
              <Typography>
                <Link
                  href="#"
                  variant="inherit"
                  underline="always"
                  color="primary"
                  onClick={() => navigate(history, formMarketLink(marketId))}
                >
                  {name}
                </Link>
              </Typography>
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
                    <ExpiredDisplay expiresDate={updatedAt} />
                  )}
                  {active && (
                    <ExpiresDisplay
                      createdAt={createdAt}
                      expirationMinutes={expirationMinutes}
                      onClick={() => isAdmin && navigate(history, formMarketManageLink(marketId))}
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
                <CommentType className={classes.commentType} type={ISSUE_TYPE} />
              )}
            </CardContent>
            <CardActions>
              <DialogActions
                isAdmin={myPresence.is_admin}
                marketStage={marketStage}
                marketType={marketType}
                inArchives={myPresence.market_hidden}
                marketId={marketId}
              />
            </CardActions>
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

DecisionDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DecisionDialogs;
