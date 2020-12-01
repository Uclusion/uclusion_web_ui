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
import { NonParticipantMarketsContext } from '../../contexts/NonParticipantMarketsContext/NonParticipantMarketsContext'
import { updateNonParticipatingMarketDetails } from '../../contexts/NonParticipantMarketsContext/nonParticipantsMarketsContextReducer'

function MarketLinks (props) {
  const { links, isArchive } = props
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [nonParticipantMarketState, nonParticipantMarketDispatch] = useContext(NonParticipantMarketsContext);
  const [marketInfoList, marketInfoDispatch] = useReducer((state, action) => {
    const { marketDetails } = action;
    if (marketDetails.isNotCollaborator) {
      return _.unionBy(state, [{ ...marketDetails }], 'id');
    }
    // If we have local data make sure it overwrites the not collaborator version
    return _.unionBy([{ ...marketDetails }], state, 'id');
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
    if (!marketState.initializing && !marketPresencesState.initializing) {
      links.forEach((marketId) => {
        const marketDetails = getMarket(marketState, marketId);
        const foundMarket = marketInfoList.find((aMarket) => aMarket.id === marketId);
        if (marketDetails && (!foundMarket || foundMarket.isNotCollaborator)) {
          const marketPresences = getMarketPresences(marketPresencesState, marketDetails.id) || [];
          const myPresence = marketPresences.find((presence) => presence.current_user) || {};
          const { following } = myPresence;
          const { market_stage: marketStage } = marketDetails;
          const active = marketStage === ACTIVE_STAGE && following;
          addMarket(marketDetails, active);
        } else if (!foundMarket) {
          const nonParticipatingMarketDetails = getMarket(nonParticipantMarketState, marketId);
          if (!nonParticipatingMarketDetails) {
            console.info(`Getting ${marketId} for market links`);
            getMarketInfo(marketId).then((originalMarket) => {
              const market = convertDates(originalMarket);
              market.isNotCollaborator = true;
              nonParticipantMarketDispatch(updateNonParticipatingMarketDetails(market));
              const { market_stage: marketStage } = market;
              const active = marketStage === ACTIVE_STAGE;
              addMarket(market, active);
            });
          } else {
            const { market_stage: marketStage } = nonParticipatingMarketDetails;
            const active = marketStage === ACTIVE_STAGE;
            addMarket(nonParticipatingMarketDetails, active);
          }
        }
      });
    }
    return () => {};
  }, [isArchive, links, marketInfoList, marketPresencesState, marketState, nonParticipantMarketDispatch,
    nonParticipantMarketState]);

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
