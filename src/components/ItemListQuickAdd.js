/*
Represents the menu display for quick adding an item.
It allows the title to be set, and gives an add or cancel button
 */

import React from 'react'
import {
  Button,
  TextField,
  Paper
} from '@material-ui/core'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'

const styles = theme => ({

  hidden: {
    display: 'none'
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  dense: {
    marginTop: 16,
  },
  menu: {
    width: 200,
  },
})

class ItemListQuickAdd extends React.Component {

  constructor (props) {
    super(props)
    this.state = {title: ''}
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange = (name) => (event) => {
    let value = event.target.value
    this.setState({
      [name]: value
    })
  }



  render () {
    //add on click and cancel on click will be called with the value of the text field
    const {visible, classes, addOnClick, cancelOnClick, intl} = this.props;
    if(!visible){
      return null;
    }
    return (
      <Paper className={'container'}>
        <TextField
          id="title"
          label={intl.formatMessage({id: 'titleLabel'})}
          multiline
          rows="4"
          defaultValue=""
          className={classes.textField}
          margin="normal"
          variant="filled"
          onChange={this.handleChange('title')}
        />
        <Button variant='contained' color='primary'
                onClick={() => addOnClick(this.state.title)}>{intl.formatMessage({id: 'addButton'})}</Button>
        <Button variant='contained'
                onClick={() => cancelOnClick(this.state.title)}>{intl.formatMessage({id: 'cancelButton'})}</Button>
      </Paper>
    )
  }

}

ItemListQuickAdd.propTypes = {
  classes: PropTypes.object.isRequired,
  addOnClick: PropTypes.func.isRequired,
  cancelOnClick: PropTypes.func.isRequired
}

export default injectIntl(withStyles(styles, {withTheme: true})(ItemListQuickAdd))