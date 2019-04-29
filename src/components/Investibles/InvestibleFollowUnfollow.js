import React from 'react';
import { connect } from 'react-redux';
import { IconButton } from '@material-ui/core';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import VolumeUp from '@material-ui/icons/VolumeUp';
import VolumeOffSharp from '@material-ui/icons/VolumeOffSharp';
import { followUnfollowInvestible } from '../../store/MarketInvestibles/actions';

function InvestibleFollowUnfollow(props) {
  const { dispatch, investible, useIconButton } = props;
  const { current_user_is_following } = investible;

  function doFollowToggle() {
    dispatch(followUnfollowInvestible({
      investible,
      stopFollowing: current_user_is_following,
    }));
  }

  function getButton() {
    const onclick = () => doFollowToggle();
    if (current_user_is_following) {
      return <IconButton onClick={onclick}><VolumeUp/></IconButton>;
    }
    return <IconButton onClick={onclick}><VolumeOffSharp/></IconButton>;
  }

  return getButton();
}

InvestibleFollowUnfollow.propTypes = {
  dispatch: PropTypes.func.isRequired,
  useIconButton: PropTypes.bool,
  investible: PropTypes.object,
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(InvestibleFollowUnfollow)));
