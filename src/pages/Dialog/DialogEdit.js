import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router';
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import { decomposeMarketPath, formMarketLink, makeBreadCrumbs, navigate, } from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { addMarketToStorage, getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets'
import PlanningDialogEdit from './Planning/PlanningDialogEdit'
import DecisionDialogEdit from './Decision/DecisionDialogEdit'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'

function DialogEdit(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType } = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const breadCrumbTemplates = [{ name: currentMarketName, link: formMarketLink(marketId) }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const editVerbiage = intl.formatMessage({ id: 'edit' });
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const loading = !userId || !marketType;

  function onCancel() {
    navigate(history, formMarketLink(marketId));
  }

  function updateMarketInStorage(market) {
    const diffSafe = {
      ...market,
      updated_by: userId,
      updated_by_you: true,
    };
    addMarketToStorage(marketsDispatch, diffDispatch, diffSafe);
  }

  function onSave(market) {
    updateMarketInStorage(market);
    navigate(history, formMarketLink(marketId));
  }

  if (_.isEmpty(marketId)) {
    return <React.Fragment/>
  }

  return (
    <Screen
      title={editVerbiage}
      hidden={hidden}
      tabTitle={editVerbiage}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
    >
      {!hidden && marketType === DECISION_TYPE && (
        <DecisionDialogEdit
          onSpinStop={onSave}
          market={renderableMarket}
          onCancel={onCancel}
        />
      )}
      {!hidden && marketType === PLANNING_TYPE && (
        <PlanningDialogEdit
          onSpinStop={onSave}
          market={renderableMarket}
          onCancel={onCancel}
        />
      )}
    </Screen>
  );
}

DialogEdit.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogEdit;
