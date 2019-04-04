import React from 'react';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getSelectedStage } from '../../store/ActiveSearches/reducer';
import { getStages } from '../../store/Markets/reducer';
import { followUnFollowMarketStage } from '../../store/Markets/actions';

function MarketStageFollowUnfollow(props) {
  const {
    marketId,
    dispatch,
    selectedStage,
    marketStages
  } = props;
  const currentStage = selectedStage && selectedStage[marketId];
  const following = currentStage && marketStages && marketStages[marketId];

  function onClick() {
    // check if we have a current stage and if we have accurate follow info
    if (currentStage && marketStages && marketStages[marketId]) {
      dispatch(followUnFollowMarketStage({ marketId, currentStage, following }));
    }
  }

  function getIcon() {
    if (following) {
      return <Favorite onClick={onClick} />;
    }
    return <FavoriteBorder onClick={onClick} />;
  }

  return getIcon();
}

function mapStateToProps(state) {
  return {
    marketStages: getStages(state.marketsReducer),
    selectedStage: getSelectedStage(state.activeSearches),
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

MarketStageFollowUnfollow.propTypes = {
  marketStages: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
  selectedStage: PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(MarketStageFollowUnfollow);
