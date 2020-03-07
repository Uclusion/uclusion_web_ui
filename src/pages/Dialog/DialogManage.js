import React, { useContext } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import {
  makeBreadCrumbs, decomposeMarketPath, formMarketLink, navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { ACTIVE_STAGE, DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import ManageParticipants from './Planning/ManageParticipants';
import AddressList from './AddressList';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import UclusionTour from '../../components/Tours/UclusionTour';
import {
  PURE_SIGNUP_ADD_PEOPLE,
  PURE_SIGNUP_ADD_PEOPLE_STEPS,
  PURE_SIGNUP_FAMILY_NAME
} from '../../components/Tours/pureSignupTours';
import queryString from 'query-string'
import { Typography } from '@material-ui/core'
import DeadlineExtender from './Decision/DeadlineExtender'

function DialogManage(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '');
  const { expires, participation } = values || {};
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType, market_stage: marketStage } = renderableMarket;
  const active = marketStage === ACTIVE_STAGE;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const manageVerbiage = intl.formatMessage({ id: 'manage' });
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const myRealPresence = myPresence || {};
  const { is_admin: isAdmin, following, id: myUserId } = myRealPresence;
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const loading = !marketType || (marketType !== PLANNING_TYPE && !myPresence);

  function onDone() {
    navigate(history, formMarketLink(marketId));
  }

  function getInitiativeLinkName(baseInvestible) {
    const { investible } = baseInvestible;
    const { name } = investible;
    return name;
  }

  const linkName = marketType === INITIATIVE_TYPE && !_.isEmpty(investibles)
    ? getInitiativeLinkName(investibles[0])
    : currentMarketName;
  const breadCrumbTemplates = [{ name: linkName, link: formMarketLink(marketId), id: 'marketCrumb'}];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  return (
    <Screen
      title={manageVerbiage}
      hidden={hidden}
      tabTitle={manageVerbiage}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
    >
      {participation && marketType === DECISION_TYPE && myPresence && (
        <div id="decisionAddressList">
          <UclusionTour
            name={PURE_SIGNUP_ADD_PEOPLE}
            family={PURE_SIGNUP_FAMILY_NAME}
            steps={PURE_SIGNUP_ADD_PEOPLE_STEPS}
            shouldRun={isAdmin}
            hidden={hidden}
          />
          <AddressList
            market={renderableMarket}
            isAdmin={isAdmin}
            following={following}
            myUserId={myUserId}
            onCancel={onDone}
            onSave={onDone}
          />
        </div>
      )}
      {marketType !== PLANNING_TYPE && expires && isAdmin && active && (
        <>
          <Typography>
            {intl.formatMessage({ id: 'decisionDialogExtendDaysLabel' })}
          </Typography>
          <DeadlineExtender
            market={renderableMarket}
            onCancel={onDone}
          />
        </>
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
      {participation && marketType === INITIATIVE_TYPE && myPresence && (
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
