import React, { useContext } from 'react'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router'
import {
  decomposeMarketPath,
  formInvestibleLink,
  formMarketLink,
  makeBreadCrumbs,
  navigate,
} from '../../utils/marketIdPathFunctions'
import queryString from 'query-string'
import { getInvestible, refreshInvestibles, } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarket, getMyUserForMarket, } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketPresences,
  removeInvestibleInvestments
} from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import Screen from '../../containers/Screen/Screen'
import { PLANNING_TYPE } from '../../constants/markets'
import PlanningInvestibleEdit from './Planning/PlanningInvestibleEdit'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'

function InvestibleEdit (props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '') || {};
  const { assign, review, approve } = values;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const inv = getInvestible(investiblesState, investibleId);
  const fullInvestible = inv || { investible: { name: '' } };
  const [marketsState] = useContext(MarketsContext);
  const userId = getMyUserForMarket(marketsState, marketId);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const isAdmin = myPresence && myPresence.is_admin;
  const { investible: myInvestible } = fullInvestible;
  const { name } = myInvestible;
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const isPlanning = market && market.market_type === PLANNING_TYPE;
  const loading = !market || !inv || !userId;


  function onCancel() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function onSave (result, stillEditing) {
    // the edit ony contains the investible data and assignments, not the full market infos
    if (result) {
      const { fullInvestible, assignmentChanged } = result;
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
      if (assignmentChanged) {
        removeInvestibleInvestments(marketPresencesState, marketPresencesDispatch, marketId, investibleId);
      }
    }
    if (!stillEditing) {
      navigate(history, formInvestibleLink(marketId, investibleId));
    }
  }

  const { name: marketName } = market;
  const breadCrumbTemplates = [{ name, link: formInvestibleLink(marketId, investibleId) }];
  breadCrumbTemplates.unshift({ name: marketName, link: formMarketLink(marketId) });
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  if (loading) {
    return (
      <Screen
        title={name}
        tabTitle={name}
        breadCrumbs={breadCrumbs}
        hidden={hidden}
        loading
      >
        <div/>
      </Screen>
    );
  }

  return (
    <Screen
      title={intl.formatMessage({ id: 'edit' })}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
    >
      {!hidden && isPlanning && inv && (
        <PlanningInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onSave}
          onCancel={onCancel}
          isAdmin={isAdmin}
          isAssign={assign === 'true'}
          isReview={review === 'true'}
          isApprove={approve === 'true'}
        />
      )}
    </Screen>
  );
}

InvestibleEdit.propTypes = {
  hidden: PropTypes.bool,
};

InvestibleEdit.defaultProps = {
  hidden: false,
};

export default InvestibleEdit;
