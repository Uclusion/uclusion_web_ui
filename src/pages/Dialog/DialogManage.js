import React, { useContext } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  makeBreadCrumbs, decomposeMarketPath, formMarketLink, navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import ManageParticipants from './Planning/ManageParticipants';
import AddressList from './AddressList';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';

function DialogManage(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType } = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const manageVerbiage = intl.formatMessage({ id: 'manage' });
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const myRealPresence = myPresence || {};
  const { is_admin: isAdmin } = myRealPresence;
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const loading = !marketType || (marketType !== PLANNING_TYPE && myPresence);
  function onDone() {
    navigate(history, formMarketLink(marketId));
  }
  function getInitiativeLinkName(baseInvestible) {
    const { investible } = baseInvestible;
    const { name } = investible;
    return name;
  }
  const linkName = marketType === INITIATIVE_TYPE ? getInitiativeLinkName(investibles[0])
    : currentMarketName;
  const breadCrumbTemplates = [{ name: linkName, link: formMarketLink(marketId) }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  return (
    <Screen
      title={manageVerbiage}
      hidden={hidden}
      tabTitle={manageVerbiage}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
    >
      {marketType === DECISION_TYPE && myPresence && (
        <AddressList
          market={renderableMarket}
          isAdmin={isAdmin}
          onCancel={onDone}
          onSave={onDone}
        />
      )}
      {marketType === PLANNING_TYPE && (
        <ManageParticipants
          market={renderableMarket}
          investibles={investibles}
          marketPresences={marketPresences}
          onCancel={onDone}
          onSave={onDone}
        />
      )}
      {marketType === INITIATIVE_TYPE && myPresence && (
        <AddressList
          market={renderableMarket}
          isAdmin={isAdmin}
          showObservers={false}
          onCancel={onDone}
          onSave={onDone}
          intl={intl}
        />
      )}
    </Screen>
  );
}

DialogManage.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogManage;
