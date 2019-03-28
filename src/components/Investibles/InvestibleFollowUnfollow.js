import React from 'react';
import { connect } from 'react-redux';
import { IconButton } from "@material-ui/core";
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
import { followUnfollowInvestible } from '../../store/MarketInvestibles/actions';

function InvestibleFollowUnfollow(props){
  const { dispatch, investible, useIconButton } = props;
  const { current_user_is_following } = investible;

  function doFollowToggle(){
    dispatch(followUnfollowInvestible({
      investible,
      stopFollowing: current_user_is_following,
    }));
  }

  /** THis sucks, refs suck too. Need to figure out how to clean this code up **/
  function getButton(){
    const onclick = () => doFollowToggle();
    if (useIconButton) {
      if (current_user_is_following) {
        return  <IconButton onClick={onclick}><Favorite /></IconButton>;
      }
      return <IconButton onClick={onclick}><FavoriteBorder /></IconButton>;
    }
    if (current_user_is_following) {
      return <Favorite onClick={onclick} />;
    }
    return <FavoriteBorder onClick={onclick} />;
  }

  return getButton();
}

InvestibleFollowUnfollow.propTypes = {
  dispatch: PropTypes.func.isRequired,
  useIconButton: PropTypes.boolean,
  investible: PropTypes.object,
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(InvestibleFollowUnfollow)));
