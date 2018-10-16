import React from 'react'
import {
  Grid,
  ListSubheader
} from '@material-ui/core'
import Add from '@material-ui/icons/Add'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import ItemListQuickAdd from './ItemListQuickAdd'


const styles = (theme) => ({
  subList: {
    padding: theme.spacing.unit
  }

})

class ItemListCategory extends React.Component {

  constructor (props) {
    super(props);
    this.state = {...props, quickAddVisible: false};
  }

  addOnClick = () => {
      this.setState({quickAddVisible:true});
  }

  addCancelOnClick = () => {
      this.setState({quickAddVisible: false});
  }

  addSaveOnClick = (addOnSave, value) => {
      addOnSave(value); //save the item out, and then hide this
      this.setState({quickAddVisible: false});
  }

  render (){
    const {classes, title, items, headerActions, submitQuickAdd} = this.props
    return (
      <div className={classes.subList}>
      <ListSubheader component="div">{title}<Add/></ListSubheader>
        <Grid container direction="column" justify="flex-start" alignItems="stretch">
        <ItemListQuickAdd visible={this.state.quickAddVisible}/>
        {items}
      </Grid>
      </div>
    )
  }
}


ItemListCategory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  category: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
}

export default withStyles(styles, {withTheme: true})(ItemListCategory)