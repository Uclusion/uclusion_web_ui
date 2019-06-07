import React from 'react';
import { injectIntl } from 'react-intl';
import { Tooltip, IconButton } from '@material-ui/core';
import VolumeUp from '@material-ui/icons/VolumeUp';
import VolumeOffSharp from '@material-ui/icons/VolumeOffSharp';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getSelectedStage } from '../../store/ActiveSearches/reducer';
import { getStages } from '../../store/Markets/reducer';
import { followUnFollowMarketStage } from '../../api/markets';

function MarketStageFollowUnfollow(props) {
  const {
    marketId,
    dispatch,
    selectedStage,
    marketStages,
    intl,
  } = props;
  const currentStage = selectedStage && selectedStage[marketId];

  function amFollowing() {
    // we are following if we have everything available, and it's following is true
    const stageInfoAvailable = currentStage && marketStages && marketStages[marketId];
    if (stageInfoAvailable) {
      const currentStageObject = marketStages[marketId].find(element => element.id === currentStage);
      return currentStageObject && currentStageObject.following;
    }
    return false;
  }

  const following = amFollowing();

  function doFollowingToggle() {
    // check if we have a current stage and if we have accurate follow info
    console.debug('checking following');
    if (currentStage && marketStages && marketStages[marketId]) {
      console.debug('Following');
      followUnFollowMarketStage(currentStage, following, dispatch);
    }
  }

  function getIcon() {
    if (currentStage) {
      if (!following) {
        return (
          <Tooltip title={intl.formatMessage({ id: 'marketStageFollowTooltip' })}>
            <IconButton onClick={() => doFollowingToggle()}>
              <VolumeUp />
            </IconButton>
          </Tooltip>
        );
      }
      if (following) {
        return (
          <Tooltip title={intl.formatMessage({ id: 'marketStageUnFollowTooltip' })}>
            <IconButton onClick={() => doFollowingToggle()}>
              <VolumeOffSharp />
            </IconButton>
          </Tooltip>
        );
      }
    }
    return <div />;
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

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(MarketStageFollowUnfollow));
