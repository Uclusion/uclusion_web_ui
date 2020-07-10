import React, { useContext } from 'react'
import _ from 'lodash'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import PlanningIdeas from './PlanningIdeas'
import { checkInProgressWarning, useInvestiblesByPersonStyles } from './PlanningDialog'
import { getUserInvestibles } from './userUtils'
import PropTypes from 'prop-types'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { ACTIVE_STAGE } from '../../../constants/markets'
import {
  getAcceptedStage,
  getBlockedStage,
  getInCurrentVotingStage,
  getInReviewStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'

function InvestiblesByWorkspace(props) {
  const {
    workspaces
  } = props;
  const classes = useInvestiblesByPersonStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  return workspaces.map(market => {
    const marketPresences = getMarketPresences(marketPresencesState, market.id);
    const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
    const presence = myPresence || {};
    const comments = getMarketComments(commentsState, market.id);
    const investibles = getMarketInvestibles(investiblesState, market.id);
    const acceptedStage = getAcceptedStage(marketStagesState, market.id) || {};
    const inDialogStage = getInCurrentVotingStage(marketStagesState, market.id) || {};
    const inReviewStage = getInReviewStage(marketStagesState, market.id) || {};
    const inBlockingStage = getBlockedStage(marketStagesState, market.id) || {};
    const visibleStages = [
      inDialogStage.id,
      acceptedStage.id,
      inReviewStage.id,
      inBlockingStage.id
    ];
    const myInvestibles = getUserInvestibles(
      presence.id,
      market.id,
      investibles,
      visibleStages,
    );
    if (_.isEmpty(myInvestibles)) {
      return React.Fragment;
    }
    return (
      <Card key={market.id} elevation={0} className={classes.root}>
        <CardHeader
          className={classes.header}
          id={`m${market.id}`}
          title={market.name}
          titleTypographyProps={{ variant: "subtitle2" }}
        />
        <CardContent className={classes.content}>
          {market.id &&
            acceptedStage &&
            inDialogStage &&
            inReviewStage &&
            inBlockingStage && (
              <PlanningIdeas
                investibles={myInvestibles}
                marketId={market.id}
                acceptedStageId={acceptedStage.id}
                inDialogStageId={inDialogStage.id}
                inReviewStageId={inReviewStage.id}
                inBlockingStageId={inBlockingStage.id}
                activeMarket={market.market_stage === ACTIVE_STAGE}
                comments={comments}
                presenceId={presence.id}
                warnAccepted={checkInProgressWarning(myInvestibles, comments, acceptedStage.id, presence.id, market.id)}
              />
            )}
        </CardContent>
      </Card>
    );
  });
}

InvestiblesByWorkspace.propTypes = {
  workspaces: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InvestiblesByWorkspace;
