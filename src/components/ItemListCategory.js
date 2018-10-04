import React from 'react'
import {
  Grid,
  ListSubheader
} from '@material-ui/core'
import Add from '@material-ui/icons/Add'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'


const styles = (theme) => ({
  subList: {
    padding: theme.spacing.unit
  }

})

class ItemListCategory extends React.Component {

  render () {
    const {classes, title, items, headerActions} = this.props

    return (
      <div className={classes.subList}>
      <ListSubheader component="div">{title}<Add/></ListSubheader>
      <Grid container direction="column" justify="flex-start" alignItems="stretch">
        {items}
      </Grid>
      </div>
    )
  };
}


ItemListCategory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  category: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
}

export default withStyles(styles, {withTheme: true})(ItemListCategory)