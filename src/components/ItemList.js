import React from 'react'
import {
  List,
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
    padding: theme.spacing.unit * 2,
    justifyContent: 'flex-end'
  }

})

class ItemList extends React.Component {

  //TODO: this may need to change to pasing in the panels, sice we probably want to customize the entire list (e.g. just render the children in the list
  render () {
    const {classes, title, categoryLists, headerActions} = this.props
    const positionedHeaderActions = headerActions.map((element, index) => <div key={index}
                                                                               className={classes.headerButton}>{element}</div>)
    return (<List className={classes.mainGrid}>
      <div className={classes.headerBox}>
        <Typography variant="display1" className={classes.headerTitle} gutterBottom>
          {title}
        </Typography>
        {positionedHeaderActions}
      </div>
      <div className={classes.headerBottom}></div>
      {categoryLists}
    </List>)
  };
}


ItemList.propTypes = {
  title: PropTypes.arrayOf(PropTypes.object).isRequired,
  categoryLists: PropTypes.object.isRequired,
  headerActions: PropTypes.object.isRequired
}


export default withStyles(styles, {withTheme: true})(ItemList)