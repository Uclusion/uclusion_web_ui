import React, { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import {
  lockInvestibleForEdit,
  realeaseInvestibleEditLock,
} from '../../api/investibles';
import {
  decomposeMarketPath, formInvestibleLink,
  formMarketLink,
  makeBreadCrumbs, navigate,
} from '../../utils/marketIdPathFunctions';
import {
  getInvestible,
} from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import {
  getMarket,
  getMyUserForMarket,
} from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import Screen from '../../containers/Screen/Screen';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import DecisionInvestibleEdit from './Decision/DecisionInvestibleEdit';
import PlanningInvestibleEdit from './Planning/PlanningInvestibleEdit';
import InitiativeInvestibleEdit from './Initiative/InitiativeInvestibleEdit';

function InvestibleEdit(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const fullInvestible = inv || { investible: { name: '' } };
  const [marketsState] = useContext(MarketsContext);
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const userId = user.id;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const isAdmin = myPresence && myPresence.is_admin;
  const { investible: myInvestible } = fullInvestible;
  const { name, locked_by: lockedBy } = myInvestible;
  const [lockedInvestibleId, setLockedInvestibleId] = useState(undefined);
  const [lockedInvestibleIdMarketId, setLockedInvestibleIdMarketId] = useState(undefined);
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const isDecision = market && market.market_type === DECISION_TYPE;
  const isPlanning = market && market.market_type === PLANNING_TYPE;
  const isInitiative = market && market.market_type === INITIATIVE_TYPE;

  useEffect(() => {
    if (!hidden && investibleId !== lockedInvestibleId) {
      setLockedInvestibleIdMarketId(marketId);
      // for now, just break the lock always
      const breakLock = true;
      // console.debug('Taking out lock');
      lockInvestibleForEdit(marketId, investibleId, breakLock)
        .then(() => setLockedInvestibleId(investibleId));
    }
    // We need this way otherwise if they navigate out by back button we don't release the lock
    if (hidden && lockedInvestibleId) {
      realeaseInvestibleEditLock(lockedInvestibleIdMarketId, lockedInvestibleId)
        .then(() => setLockedInvestibleId(undefined));
    }
  }, [hidden, lockedInvestibleId, investibleId, marketId, lockedInvestibleIdMarketId]);

  function onDone() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function onSave() {
    // Save removes the lock so no need to release
    setLockedInvestibleId(undefined);
    onDone();
  }

  const { name: marketName } = market;
  const breadCrumbTemplates = [{ name, link: formInvestibleLink(marketId, investibleId) }];
  if (!isInitiative) {
    breadCrumbTemplates.unshift({ name: marketName, link: formMarketLink(marketId) });
  }
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const someoneElseEditing = lockedBy && (lockedBy !== userId);
  const warning = someoneElseEditing ? intl.formatMessage({ id: 'edit_lock' }) : undefined;
  if (!market || !inv) {
    return (
      <Screen
        title={name}
        tabTitle={name}
        breadCrumbs={breadCrumbs}
        hidden={hidden}
        warning={warning}
        loading
      >
        <div />
      </Screen>
    );
  }

  return (
    <Screen
      title={intl.formatMessage({ id: 'edit' })}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      warning={warning}
    >
      {isDecision && inv && (
        <DecisionInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          userId={userId}
          onSave={onSave}
          onCancel={onDone}
          isAdmin={isAdmin}
        />
      )}
      {isPlanning && inv && (
        <PlanningInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onSave}
          onCancel={onDone}
          isAdmin={isAdmin}
        />
      )}
      {isInitiative && inv && (
        <InitiativeInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onSave}
          onCancel={onDone}
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
