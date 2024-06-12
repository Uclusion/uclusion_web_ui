import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { ACTIVE_STAGE } from '../../constants/markets';
import ManageUsers from './UserManagement/ManageUsers';

function DialogManage(props) {
  const { marketId, name, group } = props;
  const [marketsState] = useContext(MarketsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_stage: marketStage } = renderableMarket;
  const active = marketStage === ACTIVE_STAGE;

  if (!active) {
    return React.Fragment;
  }

  return (
      <ManageUsers
        market={renderableMarket}
        name={name}
        group={group}
      />
  );
}

DialogManage.propTypes = {
  marketId: PropTypes.string.isRequired
};

export default DialogManage;
