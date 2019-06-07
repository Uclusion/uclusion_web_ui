import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles, IconButton, Tooltip } from '@material-ui/core';
import Info from '@material-ui/icons/Info';
import VolumeUp from '@material-ui/icons/VolumeUp';
import VolumeOffSharp from '@material-ui/icons/VolumeOffSharp';
import { getCurrentMarketPresence } from '../../utils/marketSelectionFunctions';
import { followUnfollowMarket } from '../../api/markets';
import HelpMovie from '../ModalMovie/HelpMovie';

const styles = theme => ({
  root: {
    color: 'inherit',
  },
  container: {
    flexShrink: 0,
  },
});

function MarketFollowUnfollow(props) {
  const [showSubscriptionHelp, setShowSubscriptionHelp] = useState(false);
  const {
    dispatch,
    user,
    marketId,
    classes,
    intl,
  } = props;

  const marketPresence = getCurrentMarketPresence(user);
  // if we don't know the market presence, just render an unfollowed version
  if (!marketPresence || marketPresence.id !== marketId) {
    return <Tooltip title={intl.formatMessage({ id: 'marketFollowTooltip' })}><IconButton className={classes.root} onClick={onclick}><VolumeUp /></IconButton></Tooltip>;
  }
  const { following } = marketPresence;

  function doFollowingToggle() {
    followUnfollowMarket(following, dispatch);
  }

  function getIcon() {
    const onclick = () => doFollowingToggle();
    if (!following) {
      return <Tooltip title={intl.formatMessage({ id: 'marketFollowTooltip' })}><IconButton className={classes.root} onClick={onclick}><VolumeUp /></IconButton></Tooltip>;
    }
    return <Tooltip title={intl.formatMessage({ id: 'marketUnFollowTooltip' })}><IconButton className={classes.root} onClick={onclick}><VolumeOffSharp /></IconButton></Tooltip>;
  }

  return (
    <div className={classes.container}>
      {getIcon()}
      <HelpMovie name="subscriptionsHelp" open={showSubscriptionHelp} onClose={() => setShowSubscriptionHelp(false)} dontAutoOpen />
      <IconButton
        name="subscriptioninfo"
        aria-label="Subscription Help"
        className={classes.root}
        onClick={(event) => {
          event.preventDefault();
          setShowSubscriptionHelp(true);
        }}
      >
        <Info />
      </IconButton>
    </div>
  );
}

MarketFollowUnfollow.propTypes = {
  dispatch: PropTypes.func.isRequired,
  user: PropTypes.object,
  marketId: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(injectIntl(MarketFollowUnfollow)),
);
