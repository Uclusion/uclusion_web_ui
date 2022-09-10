import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { ACTIVE_STAGE } from '../../constants/markets'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import ManageUsers from './UserManagement/ManageUsers'

function DialogManage(props) {
  const { marketId, isInbox, name, group } = props;
  const [marketsState] = useContext(MarketsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_stage: marketStage } = renderableMarket;
  const active = marketStage === ACTIVE_STAGE;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const myRealPresence = myPresence || {};
  const { is_admin: isAdmin} = myRealPresence;

  if (!isAdmin || !active) {
    return React.Fragment;
  }

  if (isInbox) {
    return (
      <ManageUsers
        market={renderableMarket}
        isInbox
      />
    );
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
