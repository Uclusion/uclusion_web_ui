import React from 'react'
import PropTypes from 'prop-types'
import { Paper, Button, TextField } from '@material-ui/core'
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



class InvestibleListQuickAdd extends React.Component {

  constructor (props) {
    super(props)
    this.state = {}
    this.handleChange = this.handleChange.bind(this);
    this.addOnClick = this.addOnClick.bind(this);
    this.cancelOnClick = this.cancelOnClick.bind(this);
  }

  handleChange = (name) => (event) => {
    let value = event.target.value
    this.setState({
      [name]: value
    })
  }

  addOnClick = (value) => {
    //fill in what to do here
  };

  cancelOnClick = (value) => {
    //do something here too
  };


  render () {
    const { classes, user, marketId, category, visible, intl } = this.props;
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
                onClick={() => this.addOnClick()}>{intl.formatMessage({id: 'addButton'})}</Button>
        <Button variant='contained'
                onClick={() => this.cancelOnClick()}>{intl.formatMessage({id: 'cancelButton'})}</Button>
      </Paper>
    )
  };
}


InvestibleListQuickAdd.propTypes = {
  category: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired
}

export default injectIntl(withStyles(styles, {withTheme: true})(InvestibleListQuickAdd))
