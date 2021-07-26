import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router';
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import queryString from 'query-string'
import Screen from '../../containers/Screen/Screen'
import PlanningAdd from './PlanningAdd'
import { DECISION_TYPE, PLANNING_TYPE, } from '../../constants/markets'
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { canCreate } from '../../contexts/AccountContext/accountContextHelper'
import { getInlineBreadCrumbs } from '../Investible/Decision/DecisionInvestible'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import UpgradeBanner from '../../components/Banners/UpgradeBanner';

function DialogAdd(props) {
  const { hidden } = props;
  const history = useHistory();
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type } = values;
  const intl = useIntl();
  const [marketState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const addTitleName = type === DECISION_TYPE ? 'addDecision' : type === PLANNING_TYPE ? 'addPlanning' : 'addInitiative';
  const [accountState] = useContext(AccountContext);
  const createEnabled = canCreate(accountState);
  const banner = !createEnabled? <UpgradeBanner/> : undefined;

  let crumbs = [];
  if (type === DECISION_TYPE) {
    const { investibleId: parentInvestibleId, id: parentMarketId } = values;
    if (parentMarketId) {
      crumbs = getInlineBreadCrumbs(marketState, parentMarketId, parentInvestibleId, investiblesState)
    }
  }
  const breadCrumbs = makeBreadCrumbs(history, crumbs, true);
  return (
    <Screen
      title={intl.formatMessage({ id: addTitleName })}
      tabTitle={intl.formatMessage({ id: addTitleName })}
      hidden={hidden}
      banner={banner}
      breadCrumbs={breadCrumbs}
    >
      {type === PLANNING_TYPE && createEnabled && (
        <PlanningAdd />
      )}
      {!createEnabled && (
        <div />
      )}
    </Screen>
  );
}

DialogAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogAdd;
