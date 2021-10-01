import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router';
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
import CardType, { VOTING_TYPE } from '../../components/CardType'
import { usePlanFormStyles } from '../../components/AgilePlan'
import ManageUsers from './UserManagement/ManageUsers'

function DialogManage (props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = usePlanFormStyles();
  const location = useLocation();
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '');
  const { expires, participation } = values || {};
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType, market_stage: marketStage } = renderableMarket;
  const active = marketStage === ACTIVE_STAGE;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const manageVerbId = expires ? 'delayExpiration' : 'manage';
  const manageVerbiage =intl.formatMessage({ id: manageVerbId });
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
      <Card>
        {participation && marketType === DECISION_TYPE && myPresence && (
          <div id="decisionAddressList">
            <CardType
              className={classes.cardType}
              type={DECISION_TYPE}
            />
              <ManageUsers
                market={renderableMarket}
                onCancel={onActionDone}
              />
          </div>
        )}
        {marketType !== PLANNING_TYPE && expires && isAdmin && active && (
          <>
            <CardType className={classes.cardType}/>
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
        {participation && marketType === INITIATIVE_TYPE && myPresence && (
          <>
            <CardType
              className={classes.cardType}
              type={VOTING_TYPE}
              label={intl.formatMessage({ id: 'initiativeAddress' })}
            />
            <CardContent className={classes.cardContent}>
              <ManageUsers
                market={renderableMarket}
                onAddNewUsers={onActionDone}
                onCancel={onActionDone}
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
