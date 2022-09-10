import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import {
  decomposeMarketPath,
  navigate
} from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import {
  getMarket
} from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import PlanningInvestibleAdd from './Planning/PlanningInvestibleAdd'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { usePlanFormStyles } from '../../components/AgilePlan'
import queryString from 'query-string'

function InvestibleAdd(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '') || {};
  const { fromCommentId, groupId } = values;
  const fromCommentIds = _.isArray(fromCommentId) ? fromCommentId : fromCommentId ? [fromCommentId] : undefined;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  // we're going to talk directly to the contexts instead of pushing messages for speed reasons
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const classes = usePlanFormStyles();
  const renderableMarket = marketId ? (getMarket(marketsState, marketId) || {}) : {};
  const { market_type: marketType, created_at: createdAt, budget_unit: budgetUnit, use_budget: useBudget,
    votes_required: votesRequired
  } = renderableMarket;
  const title = intl.formatMessage({ id: 'newStory'});

  function onInvestibleSave(investible) {
    addInvestible(investiblesDispatch, diffDispatch, investible);
  }

  function onDone(destinationLink) {
    // console.log(`Called with link ${destinationLink}`);
    if (destinationLink) {
      navigate(history, destinationLink);
    }
  }

  return (
    <Screen
      title={title}
      hidden={hidden}
      tabTitle={title}
      loading={marketId && !marketType}
    >
      {hidden ? <div /> :
        <PlanningInvestibleAdd
          marketId={marketId}
          groupId={groupId}
          onCancel={() => navigate(history)}
          onSave={onInvestibleSave}
          onSpinComplete={onDone}
          marketPresences={getMarketPresences(marketPresencesState, marketId)}
          createdAt={createdAt}
          classes={classes}
          fromCommentIds={fromCommentIds}
          maxBudgetUnit={budgetUnit}
          useBudget={useBudget ? useBudget : false}
          votesRequired={votesRequired}
        />
      }
    </Screen>
  );
}

InvestibleAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default InvestibleAdd;
