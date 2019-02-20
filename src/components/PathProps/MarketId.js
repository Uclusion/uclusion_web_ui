/**
 * Higher order component to extract the market id out of the path parts and pass it in as a prop to wrapped components.
 * Assumes youre in a react router context
 */

import React from 'react';

import { getMarketId } from '../../utils/marketIdPathFunctions';


function withMarketId(WrappedComponent) {

  class MarketId extends React.Component {

    render() {
      const marketId = getMarketId();
      return <WrappedComponent {...this.props} marketId={marketId} />;
    }
  }

  return MarketId;
}

export { withMarketId };
