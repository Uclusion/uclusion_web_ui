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

class QuickAddItemListCategory extends React.Component {

  constructor (props) {
    super(props);
    this.state = {...props, quickAddVisible: false};
    this.addOnClick = this.addOnClick.bind(this);
    this.addCancelOnClick = this.addCancelOnClick.bind(this);
    this.addSubmitOnClick = this.addSubmitOnClick.bind(this);
  }

  addOnClick = () => {
    this.setState({quickAddVisible: !this.state.quickAddVisible});
  }

  addCancelOnClick = () => {
    this.setState({quickAddVisible: false});
  }

  addSubmitOnClick = () => {
    this.setState({quickAddVisible: false});
  }

  addSaveOnClick = (addOnSave, value) => {
      addOnSave(value); //save the item out, and then hide this
      this.setState({quickAddVisible: false});
  }

  render (){
    const {classes, title, items, submitQuickAdd, quickAdd} = this.props
    const myQuickAdd = React.cloneElement(quickAdd, {visible:this.state.quickAddVisible, addSubmitOnClick: this.addSubmitOnClick, addCancelOnClick: this.addCancelOnClick})
    return (
      <div className={classes.subList}>
      <ListSubheader component="div">{title}<Add onClick={() => this.addOnClick()}/></ListSubheader>
        <Grid container direction="column" justify="flex-start" alignItems="stretch">
          {myQuickAdd}
          {items}
        </Grid>
      </div>
    )
  }
}


QuickAddItemListCategory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  category: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
}

export default withStyles(styles, {withTheme: true})(QuickAddItemListCategory)