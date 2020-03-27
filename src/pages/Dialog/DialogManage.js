import React, { useContext } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import {
  makeBreadCrumbs, decomposeMarketPath, formMarketLink, navigate, formInvestibleLink,
} from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { ACTIVE_STAGE, DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
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
import { Card, CardContent, Typography } from '@material-ui/core'
import DeadlineExtender from './Decision/DeadlineExtender'
import CardType, { AGILE_PLAN_TYPE, VOTING_TYPE } from '../../components/CardType'
import { usePlanFormStyles } from '../../components/AgilePlan';
import DismissableText from '../../components/Notifications/DismissableText';

function DialogManage(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = usePlanFormStyles();
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
  const { is_admin: isAdmin, id: myUserId } = myRealPresence;
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const loading = !marketType || (marketType !== PLANNING_TYPE && !myPresence)
    || (marketType === INITIATIVE_TYPE && _.isEmpty(investibles));

  function onDone() {
    if (marketType === INITIATIVE_TYPE) {
      const { investible } = investibles[0];
      const { id } = investible;
      navigate(history, formInvestibleLink(marketId, id));
    }
    else {
      navigate(history, formMarketLink(marketId));
    }
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
      {(participation || marketType === PLANNING_TYPE) && (
        <DismissableText textId='participationHelp' />
      )}
      <Card>
      {participation && marketType === DECISION_TYPE && myPresence && (
        <div id="decisionAddressList">
          <UclusionTour
            name={PURE_SIGNUP_ADD_PEOPLE}
            family={PURE_SIGNUP_FAMILY_NAME}
            steps={PURE_SIGNUP_ADD_PEOPLE_STEPS}
            shouldRun={isAdmin}
            hidden={hidden}
          />
          <CardType
            className={classes.cardType}
            type={DECISION_TYPE}
            label={intl.formatMessage({ id: "dialogAddress" })}
          />
          <CardContent className={classes.cardContent}>
            <AddressList
              market={renderableMarket}
              isAdmin={isAdmin}
              myUserId={myUserId}
              onCancel={onDone}
              onSave={onDone}
            />
          </CardContent>
        </div>
      )}
      {marketType !== PLANNING_TYPE && expires && isAdmin && active && (
        <>
          <CardType
            className={classes.cardType}
            type={marketType === INITIATIVE_TYPE ? VOTING_TYPE : DECISION_TYPE}
            label={
              intl.formatMessage({ id: marketType === INITIATIVE_TYPE ? 'initiativeExtend' : 'dialogExtend' })
            }
          />
          <CardContent className={classes.cardContent}>
            <Typography>
              {intl.formatMessage({ id: 'decisionDialogExtendDaysLabel' })}
            </Typography>
            <DeadlineExtender
              market={renderableMarket}
              onCancel={onDone}
            />
          </CardContent>
        </>
      )}
      {marketType === PLANNING_TYPE && (
        <>
          <CardType
            className={classes.cardType}
            type={AGILE_PLAN_TYPE}
            label={intl.formatMessage({ id: "planAddress"})}
          />
          <CardContent className={classes.cardContent}>
            <AddressList
              market={renderableMarket}
              isOwnScreen={false}
              onCancel={onDone}
              onSave={onDone}
            />
          </CardContent>
        </>
      )}
      {participation && marketType === INITIATIVE_TYPE && myPresence && (
        <>
          <CardType
            className={classes.cardType}
            type={VOTING_TYPE}
            label={intl.formatMessage({ id: "initiativeAddress" })}
          />
          <CardContent className={classes.cardContent}>
            <AddressList
              market={renderableMarket}
              isAdmin={isAdmin}
              onCancel={onDone}
              onSave={onDone}
              intl={intl}
            />
          </CardContent>
        </>
      )}
      </Card>
    </Screen>
  );
}

DialogManage.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogManage;
