import React from 'react'
import {
  GridList,
  ListSubheader
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

class ItemListCategory extends React.Component {

  render () {
    const {classes, title, items, headerActions} = this.props

    return (
      <GridList className={classes.mainGrid}>
        <ListSubheader component="div">{title}</ListSubheader>
        {items}
      </GridList>)
  };
}


ItemListCategory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  category: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
}

export default withStyles(styles, {withTheme: true})(ItemListCategory)