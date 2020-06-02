import React, { useContext } from 'react'
import { useHistory } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import {
  decomposeMarketPath,
  formInvestibleLink,
  formMarketLink,
  makeBreadCrumbs,
  navigate,
} from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { ACTIVE_STAGE, DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'

import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import queryString from 'query-string'
import { Card, CardContent, Typography } from '@material-ui/core'
import DeadlineExtender from './Decision/DeadlineExtender'
import CardType, { AGILE_PLAN_TYPE, VOTING_TYPE } from '../../components/CardType'
import { usePlanFormStyles } from '../../components/AgilePlan'
import DismissableText from '../../components/Notifications/DismissableText'
import ManageUsers from './UserManagement/ManageUsers'
import RemoveUsers from './UserManagement/RemoveUsers'

function DialogManage (props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = usePlanFormStyles();
  const { location } = history;
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '');
  const { expires, participation, removal } = values || {};
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
  const { is_admin: isAdmin} = myRealPresence;
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const loading = !marketType || (marketType !== PLANNING_TYPE && !myPresence)
    || (marketType === INITIATIVE_TYPE && _.isEmpty(investibles));

  function getInitiativeLinkName (baseInvestible) {
    const { investible } = baseInvestible;
    const { name } = investible;
    return name;
  }
  function onActionDone () {
    if (marketType === INITIATIVE_TYPE) {
      const { investible } = investibles[0];
      const { id } = investible;
      navigate(history, formInvestibleLink(marketId, id));
    } else {
      navigate(history, formMarketLink(marketId));
    }
  }

  const linkName = marketType === INITIATIVE_TYPE && !_.isEmpty(investibles)
    ? getInitiativeLinkName(investibles[0])
    : currentMarketName;
  const breadCrumbTemplates = [{ name: linkName, link: formMarketLink(marketId), id: 'marketCrumb' }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  return (
    <Screen
      title={manageVerbiage}
      hidden={hidden}
      tabTitle={manageVerbiage}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
    >
      {(participation || marketType === PLANNING_TYPE) && !removal && (
        <DismissableText textId="participationHelp"/>
      )}
      <Card elevation={0}>
        {participation && marketType === DECISION_TYPE && myPresence && (
          <div id="decisionAddressList">
            <CardType
              className={classes.cardType}
              type={DECISION_TYPE}
              label={intl.formatMessage({ id: 'dialogAddress' })}
            />
              <ManageUsers
                market={renderableMarket}
                onAddNewUsers={onActionDone}
                onCancel={onActionDone}
              />
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
                onCancel={onActionDone}
              />
            </CardContent>
          </>
        )}
        {participation && marketType === PLANNING_TYPE && (
          <>
          <Typography className={classes.cardTitle}>
            Add Collaborators
          </Typography>
            <ManageUsers
              market={renderableMarket}
              onAddNewUsers={onActionDone}
              onCancel={onActionDone}
            />
          </>
        )}
        {removal && marketType === PLANNING_TYPE && (
          <>
            <CardType
              className={classes.cardType}
              type={AGILE_PLAN_TYPE}
              label={intl.formatMessage({ id: 'planRemoveAddress' })}
            />
            <RemoveUsers
              market={renderableMarket}
            />
          </>
        )}
        {participation && marketType === INITIATIVE_TYPE && myPresence && (
          <>
            <CardType
              className={classes.cardType}
              type={VOTING_TYPE}
              label={intl.formatMessage({ id: 'initiativeAddress' })}
            />
            <CardContent className={classes.cardContent}>
              {isAdmin && (
                <ManageUsers
                  market={renderableMarket}
                  onAddNewUsers={onActionDone}
                  onCancel={onActionDone}
                />
              )}
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
