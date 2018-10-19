import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Paper, Button, TextFieOutlild } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'

const styles = theme => ({

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
        <form  noValidate autoComplete="off">
        <TextField
          id="title"
          label={intl.formatMessage({id: 'titleLabel'})}
          defaultValue=""
          className={classes.textField}
          margin="normal"

          fullWidth
          onChange={this.handleChange('title')}
        />
        <TextField
          variant="outlined"
          id="description"
          label={intl.formatMessage({id: 'descriptionLabel'})}
          rowsMax="10"
          defaultValue="TestDefault"
          className={classes.textField}
          margin="normal"
          onChange={this.handleChange('description')}
        />
        <Button variant='contained' color='primary'
                onClick={() => this.addOnClick()}>{intl.formatMessage({id: 'addButton'})}</Button>
        <Button variant='contained'
                onClick={() => this.cancelOnClick()}>{intl.formatMessage({id: 'cancelButton'})}</Button>
        </form>
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
