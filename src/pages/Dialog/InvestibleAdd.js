import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import localforage from 'localforage'
import _ from 'lodash'
import { decomposeMarketPath, formMarketLink, makeBreadCrumbs, navigate, } from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { PLANNING_TYPE } from '../../constants/markets'
import PlanningInvestibleAdd from './Planning/PlanningInvestibleAdd'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { usePlanFormStyles } from '../../components/AgilePlan'
import queryString from 'query-string'
import { getInlineBreadCrumbs } from '../Investible/Decision/DecisionInvestible'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'

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
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  // we're going to talk directly to the contexts instead of pushing messages for speed reasons
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const classes = usePlanFormStyles();
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType, created_at: createdAt, parent_comment_id: inlineParentCommentId,
    parent_comment_market_id: parentMarketId, max_budget: storyMaxBudget, allow_multi_vote: allowMultiVote,
    votes_required: votesRequired
  } = renderableMarket;
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, parentMarketId || marketId) || [];
  const parentComment = comments.find((comment) => comment.id === (parentCommentId || inlineParentCommentId)) || {};
  const parentInvestibleId = parentComment.investible_id;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  let breadCrumbTemplates;
  if (parentCommentId) {
    // The inline market will be created along with the option
    breadCrumbTemplates = getInlineBreadCrumbs(marketsState, marketId, parentInvestibleId, investiblesState);
  } else if (inlineParentCommentId) {
    breadCrumbTemplates = getInlineBreadCrumbs(marketsState, parentMarketId, parentInvestibleId, investiblesState);
  } else {
    breadCrumbTemplates = [{ name: currentMarketName, link: formMarketLink(marketId) }];
  }
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const isPlanning = marketType === PLANNING_TYPE;
  const titleKey = isPlanning ? 'newStory' : 'newOption';
  const title = intl.formatMessage({ id: titleKey});
  const [storedState, setStoredState] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);

  function onInvestibleSave(investible) {
    addInvestible(investiblesDispatch, diffDispatch, investible);
  }

  const itemKey = `add_investible_${marketId}`;
  function onDone(destinationLink) {
    // console.log(`Called with link ${destinationLink}`);
    localforage.removeItem(itemKey)
      .finally(() => {
        if (destinationLink) {
          navigate(history, destinationLink);
        }
      });
  }

  useEffect(() => {
    if (!hidden) {
      localforage.getItem(itemKey).then((stateFromDisk) => {
        setStoredState(stateFromDisk || {});
        setIdLoaded(marketId);
      });
    }
    if (hidden) {
      setIdLoaded(undefined);
    }
  }, [hidden, marketId, itemKey]);

  const loading = idLoaded !== marketId || !marketType;
  return (
    <Screen
      title={title}
      hidden={hidden}
      tabTitle={title}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
    >
      {isPlanning && idLoaded === marketId && (
        <PlanningInvestibleAdd
          marketId={marketId}
          onCancel={onDone}
          onSave={onInvestibleSave}
          onSpinComplete={onDone}
          marketPresences={marketPresences}
          createdAt={createdAt}
          fromCommentIds={fromCommentIds}
          storedState={storedState}
          classes={classes}
          storyMaxBudget={storyMaxBudget}
          allowMultiVote={allowMultiVote}
          votesRequired={votesRequired}
        />
      )}
    </Screen>
  );
}

InvestibleAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default InvestibleAdd;
