import React from 'react';
import { connect } from 'react-redux';
import { IconButton, Tooltip } from '@material-ui/core';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import VolumeUp from '@material-ui/icons/VolumeUp';
import VolumeOffSharp from '@material-ui/icons/VolumeOffSharp';
import { followUnfollowInvestible } from '../../api/marketInvestibles';

function InvestibleSubscribeUnsubscribe(props) {
  const { dispatch, investible, intl } = props;
  const { current_user_is_following } = investible; //eslint-disable-line

  function doFollowToggle() {
    followUnfollowInvestible(investible, current_user_is_following, dispatch);
  }

  function getButton() {
    const onclick = () => doFollowToggle();
    if (!current_user_is_following) {
      return <Tooltip title={intl.formatMessage({ id: 'investiblesFollowTooltip' })}><IconButton onClick={onclick}><VolumeUp /></IconButton></Tooltip>;
    }
    return <Tooltip title={intl.formatMessage({ id: 'investiblesUnFollowTooltip' })}><IconButton onClick={onclick}><VolumeOffSharp /></IconButton></Tooltip>;
  }

  return getButton();
}

InvestibleSubscribeUnsubscribe.propTypes = {
  dispatch: PropTypes.func.isRequired,
  investible: PropTypes.object, //eslint-disable-line
  intl: PropTypes.object, //eslint-disable-line
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(InvestibleSubscribeUnsubscribe));
