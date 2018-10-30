import React from 'react'
import {
  Grid,
  Typography

} from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'

const styles = (theme) => ({
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
    flexDirection: 'row',
    flexGrow: 1
  }

})

class ItemList extends React.Component {

  //TODO: this may need to change to pasing in the panels, sice we probably want to customize the entire list (e.g. just render the children in the list
  render () {
    const {classes, categoryLists, headerActions} = this.props
    const positionedHeaderActions = headerActions.map((element, index) => <div key={index}
                                                                               className={classes.headerButton}>{element}</div>)
    return (
      <div>
        <div className={classes.headerBox}>
          {positionedHeaderActions}
        </div>
        <div className={classes.headerBottom}></div>

        <Grid className={classes.mainGrid} container spacing={8} justify='flex-start' alignItems='flex-start'>
          {categoryLists}
        </Grid>
      </div>
    )
  };
}


ItemList.propTypes = {
  categoryLists: PropTypes.arrayOf(PropTypes.object).isRequired,
  headerActions: PropTypes.arrayOf(PropTypes.object)
}


export default withStyles(styles, {withTheme: true})(ItemList)