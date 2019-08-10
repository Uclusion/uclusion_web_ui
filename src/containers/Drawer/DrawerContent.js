import React from 'react';
import { connect } from 'react-redux';
import MarketSelect from './MarketSelect';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { withMarketId } from '../../components/PathProps/MarketId';



import { userLogout } from '../../store/auth/actions';
import drawerActions from '../../store/drawer/actions';
import { getCurrentUser } from '../../store/Users/reducer';
import { bindActionCreators } from 'redux';
import { getMarkets } from '../../store/Markets/reducer';

const DrawerContent = (props) => {
  const {
    history,
    match,
    width,
    setDrawerOpen,
    markets,
  } = props;

  /*
  const handleSignOut = () => {
    setUclusionLocalStorageItem('auth', null);
  };
*/
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      <MarketSelect markets={markets} />
    </div>

  );
};

function mapStateToProps(state){
  return {
    user: getCurrentUser(state.usersReducer),
    userLogout,
    markets: getMarkets(state.marketsReducer),
  };
}

function mapDispatchToProps(dispatch) {
  const boundCreators = bindActionCreators({ ...drawerActions }, dispatch);
  return { ...boundCreators, dispatch };
}


export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withWidth()(withRouter(withMarketId(DrawerContent)))));
