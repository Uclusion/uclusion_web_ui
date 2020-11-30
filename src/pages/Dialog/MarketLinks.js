import React, { useContext, useEffect, useReducer } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { getMarketInfo } from '../../api/sso'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { convertDates } from '../../contexts/ContextUtils'
import InitiativesAndDialogs from '../Home/InitiativesAndDialogs'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { ACTIVE_STAGE } from '../../constants/markets'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'

function MarketLinks (props) {
  const { links, isArchive } = props
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketInfoList, marketInfoDispatch] = useReducer((state, action) => {
    const { marketDetails } = action;
    return _.unionBy(state, [{ ...marketDetails }], 'id');
  }, []);
  
  useEffect(() => {
    function addMarket(marketDetails, active) {
      if (isArchive) {
        if (!active) {
          marketInfoDispatch({ marketDetails });
        }
      }
      else if (active) {
        marketInfoDispatch({ marketDetails });
      }
    }
    links.forEach((marketId) => {
      const marketDetails = getMarket(marketState, marketId);
      if (marketDetails) {
        const marketPresences = getMarketPresences(marketPresencesState, marketDetails.id) || [];
        const myPresence = marketPresences.find((presence) => presence.current_user) || {};
        const { following } = myPresence;
        const { market_stage: marketStage } = marketDetails;
        const active = marketStage === ACTIVE_STAGE && following;
        addMarket(marketDetails, active);
      } else {
        console.info(`Getting ${marketId} for market links`);
        getMarketInfo(marketId).then((market) => {
          const marketDetails = convertDates(market);
          marketDetails.isNotCollaborator = true;
          const { market_stage: marketStage } = marketDetails;
          const active = marketStage === ACTIVE_STAGE;
          addMarket(marketDetails, active);
        });
      }
    });
    return () => {};
  }, [isArchive, links, marketPresencesState, marketState]);

  if (_.isEmpty(links)) {
    return React.Fragment;
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <InitiativesAndDialogs dialogs={marketInfoList} initiatives={[]} showParentOf={false}/>
    </div>
  )
}

MarketLinks.propTypes = {
  links: PropTypes.arrayOf(PropTypes.string).isRequired,
  isArchive:PropTypes.bool
}

MarketLinks.defaultProps = {
  isArchive: false,
};

export default MarketLinks
