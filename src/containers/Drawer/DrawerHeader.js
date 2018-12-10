import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { DrawerHeader } from '../../components/Drawer'

import drawerActions from '../../store/drawer/actions'

DrawerHeader.propTypes = {
  auth: PropTypes.object
}

const mapStateToProps = (state) => {
  const { auth, locale, drawer } = state

  return {
    auth,
    locale,
    drawer
  }
}

export default connect(
  mapStateToProps,
  {...drawerActions }
)(DrawerHeader)
