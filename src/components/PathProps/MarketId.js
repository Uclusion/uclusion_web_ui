/**
 * Higher order component to extract the market id out of the path parts and pass it in as a prop to wrapped components.
 * Assumes youre in a react router context
 */

import React from 'react';
import { connect } from 'react-redux';
import { selectMarket } from '../../store/Markets/actions';
import { getMarketId } from '../../utils/marketIdPathFunctions';

function mapStateToProps(state) {
  return { currentMarket: state.marketsReducer.currentMarket };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

function withMarketId(WrappedComponent) {
  class MarketId extends React.Component {
    constructor(props) {
      super(props);
      this.updateRedux = this.updateRedux.bind(this);
    }

    updateRedux(marketId) {
      const { dispatch, currentMarket } = this.props;
      if (marketId !== currentMarket) {
        dispatch(selectMarket(marketId));
      }
    }

    render() {
      const marketId = getMarketId();
      this.updateRedux(marketId);
      return <WrappedComponent {...this.props} marketId={marketId} />;
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(MarketId);
}

export { withMarketId };
