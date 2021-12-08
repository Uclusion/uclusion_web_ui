import React, { useContext, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import {
  createTitle,
  decomposeMarketPath,
  formMarketLink,
  makeBreadCrumbs,
  navigate,
} from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import {
  getMarket,
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser
} from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import PlanningInvestibleAdd from './Planning/PlanningInvestibleAdd'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { usePlanFormStyles } from '../../components/AgilePlan'
import queryString from 'query-string'
import { getInlineBreadCrumbs } from '../Investible/Decision/DecisionInvestible'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core'
import { PLANNING_TYPE } from '../../constants/markets'
import { getFirstWorkspace } from '../../utils/redirectUtils'

function InvestibleAdd(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '') || {};
  const { parentCommentId, fromCommentId } = values;
  const fromCommentIds = _.isArray(fromCommentId) ? fromCommentId : fromCommentId ? [fromCommentId] : undefined;
  const { marketId } = decomposeMarketPath(pathname);
  const [chosenMarketId, setChosenMarketId] = useState(undefined);
  const [chosenMarket, setChosenMarket] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  // we're going to talk directly to the contexts instead of pushing messages for speed reasons
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const classes = usePlanFormStyles();
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE) || [];
  const firstMarketId = getFirstWorkspace(planningDetails);
  const renderableMarket = getMarket(marketsState, marketId || chosenMarketId || firstMarketId) || {};
  const { market_type: marketType, created_at: createdAt, parent_comment_id: inlineParentCommentId,
    parent_comment_market_id: parentMarketId, budget_unit: budgetUnit, use_budget: useBudget,
    votes_required: votesRequired
  } = renderableMarket;
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, parentMarketId || marketId) || [];
  const parentComment = comments.find((comment) => comment.id === (parentCommentId || inlineParentCommentId)) || {};
  const parentInvestibleId = parentComment.investible_id;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  let breadCrumbTemplates;
  if (parentCommentId) {
    // The inline market will be created along with the option
    breadCrumbTemplates = getInlineBreadCrumbs(marketsState, marketId, parentInvestibleId, investiblesState);
  } else if (inlineParentCommentId) {
    breadCrumbTemplates = getInlineBreadCrumbs(marketsState, parentMarketId, parentInvestibleId, investiblesState);
  } else {
    breadCrumbTemplates = [{ name: currentMarketName,
      link: formMarketLink(marketId || chosenMarketId || firstMarketId) }];
  }
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const title = intl.formatMessage({ id: 'newStory'});
  const firstMarket = (marketId || firstMarketId) ? <PlanningInvestibleAdd
      marketId={marketId || firstMarketId}
      onCancel={(link) => {
        if (marketId) {
          onDone(link);
        } else {
          navigate(history, '/inbox');
        }
      }}
      onSave={onInvestibleSave}
      onSpinComplete={onDone}
      marketPresences={getMarketPresences(marketPresencesState, marketId || firstMarketId)}
      createdAt={createdAt}
      classes={classes}
      fromCommentIds={fromCommentIds}
      maxBudgetUnit={budgetUnit}
      useBudget={useBudget ? useBudget : false}
      votesRequired={votesRequired}
    /> : undefined;

  function onInvestibleSave(investible) {
    addInvestible(investiblesDispatch, diffDispatch, investible);
  }

  function onDone(destinationLink) {
    // console.log(`Called with link ${destinationLink}`);
    if (destinationLink) {
      navigate(history, destinationLink);
    }
  }

  const navigationMenu = (!marketId && firstMarketId) ? {
    navMenu:(
      <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} style={{border: '1px solid #ced4da'}}>
        <InputLabel id="workspaceNav">
          {intl.formatMessage({id: 'MarketSearchResultWorkspace'})}
        </InputLabel>
        <Select
          labelId="workspaceSelectLabel"
          id="workspaceSelect"
          value={chosenMarketId || firstMarketId}
          onChange={(event) => {
            const { value } = event.target;
            const market = getMarket(marketsState, value);
            setChosenMarketId(market.id);
            setChosenMarket(<PlanningInvestibleAdd
              marketId={market.id}
              onCancel={() => {
                navigate(history, '/inbox');
              }}
              onSave={onInvestibleSave}
              onSpinComplete={onDone}
              marketPresences={getMarketPresences(marketPresencesState, market.id)}
              createdAt={market.created_at}
              classes={classes}
              maxBudgetUnit={market.budget_unit}
              useBudget={market.use_budget ? market.use_budget : false}
              votesRequired={market.votes_required}
            />);
          }}
        >
          {planningDetails.map((aMarket) => {
            return (
              <MenuItem value={aMarket.id} key={`menu${aMarket.id}`}>
                {createTitle(aMarket.name, 20)}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    ), showSearch: false
  } : undefined;

  return (
    <Screen
      title={title}
      hidden={hidden}
      tabTitle={title}
      breadCrumbs={myBreadCrumbs}
      loading={(marketId && !marketType)||(!marketId && _.isEmpty(planningDetails))}
      navigationOptions={navigationMenu}
      noLeftPadding={!marketId}
      isWorkspace
    >
      {marketId && firstMarket}
      {!marketId && (chosenMarket || firstMarket)}
    </Screen>
  );
}

InvestibleAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default InvestibleAdd;
