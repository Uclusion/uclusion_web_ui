import React, { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import localforage from 'localforage';
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
  const [idLoaded, setIdLoaded] = useState(undefined);
  const [storedDescription, setStoredDescription] = useState(undefined);
  const [lockedInvestibleIdMarketId, setLockedInvestibleIdMarketId] = useState(undefined);
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const isDecision = market && market.market_type === DECISION_TYPE;
  const isPlanning = market && market.market_type === PLANNING_TYPE;
  const isInitiative = market && market.market_type === INITIATIVE_TYPE;

  useEffect(() => {
    if (!hidden) {
      if (investibleId !== lockedInvestibleId) {
        // Immediately set locked investible id to avoid multiple calls
        setLockedInvestibleId(investibleId);
        setLockedInvestibleIdMarketId(marketId);
        // for now, just break the lock always
        const breakLock = true;
        // console.debug('Taking out lock');
        lockInvestibleForEdit(marketId, investibleId, breakLock)
          .catch(() => setLockedInvestibleId(undefined));
      }
      localforage.getItem(investibleId).then((description) => {
        setStoredDescription(description || '');
        setIdLoaded(investibleId);
      });
    }
    // We need this way otherwise if they navigate out by back button we don't release the lock
    if (hidden && lockedBy && lockedInvestibleId) {
      const originalLockedId = lockedInvestibleId;
      // Set right away to avoid multiple calls
      setLockedInvestibleId(undefined);
      realeaseInvestibleEditLock(lockedInvestibleIdMarketId, lockedInvestibleId)
        .then(() => localforage.removeItem(originalLockedId))
        .catch(() => setLockedInvestibleId(originalLockedId));
    }
  }, [hidden, lockedInvestibleId, investibleId, marketId, lockedInvestibleIdMarketId, lockedBy]);

  function onDone() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  const { name: marketName } = market;
  const breadCrumbTemplates = [{ name, link: formInvestibleLink(marketId, investibleId) }];
  if (!isInitiative) {
    breadCrumbTemplates.unshift({ name: marketName, link: formMarketLink(marketId) });
  }
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const someoneElseEditing = lockedBy && (lockedBy !== userId);
  const warning = someoneElseEditing ? intl.formatMessage({ id: 'edit_lock' }) : undefined;
  if (idLoaded !== investibleId || !market || !inv) {
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
      {!hidden && isDecision && inv && idLoaded === investibleId && (
        <DecisionInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          userId={userId}
          onSave={onDone}
          onCancel={onDone}
          isAdmin={isAdmin}
          storedDescription={storedDescription}
        />
      )}
      {!hidden && isPlanning && inv && idLoaded === investibleId && (
        <PlanningInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onDone}
          onCancel={onDone}
          isAdmin={isAdmin}
          storedDescription={storedDescription}
        />
      )}
      {!hidden && isInitiative && inv && idLoaded === investibleId && (
        <InitiativeInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onDone}
          onCancel={onDone}
          storedDescription={storedDescription}
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
