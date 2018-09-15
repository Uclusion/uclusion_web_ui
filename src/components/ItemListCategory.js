import React from 'react'
import {
  List,
  ListSubheader
} from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'


const styles = (theme) => ({


})

class ItemListCategory extends React.Component {

  render () {
    const {classes, title, items, headerActions} = this.props

    return (
      <div>
      <ListSubheader component="div">{title}</ListSubheader>
      <List>
        {items}
      </List>
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