import React from 'react'
import {
  Grid
} from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'

const styles = (theme) => ({
  itemList: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  headerBox: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  headerTitle: {
    float: 'left',
  },

  headerButton: {
    float: 'right'
  },

  headerBottom: {
    clear: 'both'
  },

  mainGrid: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'auto',
  }

})

class ItemList extends React.Component {

  //TODO: this may need to change to pasing in the panels, sice we probably want to customize the entire list (e.g. just render the children in the list
  render () {
    const {classes, categoryLists, headerActions} = this.props
    const positionedHeaderActions = headerActions.map((element, index) => <div key={index}
                                                                               className={classes.headerButton}>{element}</div>)
    return (
      <div className={classes.itemList}>
        <div className={classes.headerBox}>
          {positionedHeaderActions}
        </div>
        <div className={classes.headerBottom}></div>

        <div className={classes.mainGrid}>
          {categoryLists}
        </div>
      </div>
    )
  };
}


ItemList.propTypes = {
  categoryLists: PropTypes.arrayOf(PropTypes.object).isRequired,
  headerActions: PropTypes.arrayOf(PropTypes.object)
}


export default withStyles(styles, {withTheme: true})(ItemList)