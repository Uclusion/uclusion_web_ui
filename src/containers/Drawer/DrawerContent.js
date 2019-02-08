import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { updateTheme, switchNightMode } from '../../store/themeSource/actions';
import { updateLocale } from '../../store/locale/actions';
import { DrawerContent } from '../../components/Drawer';
import { userLogout } from '../../store/auth/actions';
import drawerActions from '../../store/drawer/actions';

DrawerContent.propTypes = {
  locale: PropTypes.string.isRequired,
  updateTheme: PropTypes.func.isRequired,
  updateLocale: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  ...state,
});

export default connect(
  mapStateToProps,
  {
    updateTheme, switchNightMode, updateLocale, userLogout, ...drawerActions,
  },
)(DrawerContent);
