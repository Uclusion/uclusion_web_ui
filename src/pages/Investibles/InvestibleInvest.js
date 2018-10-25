import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import { connect } from 'react-redux'
import { injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { createInvestment } from '../../containers/MarketInvestibles/actions'

import FormControl from '@material-ui/core/FormControl';

const styles = theme => ({

  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  }
});

class InvestibleInvest extends React.Component {

  constructor (props) {
    super(props);
    this.state = {...props, quantityToInvest: 0};
    this.handleInvest = this.handleInvest.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.validateQuantityToInvest = this.validateQuantityToInvest.bind(this);
  }

  handleInvest = () => {
    const {investibleId, marketId, dispatch} = this.props;
    let quantity = parseInt(this.state['quantityToInvest'], 10);
    dispatch(createInvestment({
      investibleId,
      marketId,
      quantity
    }));
  }


  validateQuantityToInvest = (quantity) => {
    return (quantity <= this.props.sharesAvailable) && (quantity > 0) && (Math.floor(quantity) == quantity);
  }

  handleChange = (name) => (event) => {
    let value = event.target.value;
    let valid = false;
    if(name === 'quantityToInvest'){
      valid = this.validateQuantityToInvest(value);
    }

    if(valid) {
      this.setState({
        [name]: value
      })
    }
  }

  render () {
    const {classes, intl, sharesAvailable} = this.props
    return (
      <div>
        <Typography>
          {intl.formatMessage({id: 'investModalText'})}
        </Typography>
        <form className={classes.container} noValidate autoComplete="off">
          <FormControl>
            <TextField
              id="quantityToInvest"
              label={intl.formatMessage({id: 'investModalQuantityLabel'})}
              className={classes.textField}
              value={this.state.quantityToInvest}
              onChange={this.handleChange('quantityToInvest')}
              type="number"
              margin="normal"
            />
          </FormControl>
          You have {sharesAvailable} to invest
          <Button variant='contained' color='primary' onClick={this.handleInvest}>{intl.formatMessage({id: 'investButton'})}</Button>

        </form>
      </div>
    )
  }
}

InvestibleInvest.propTypes = {
  classes: PropTypes.object.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  sharesAvailable: PropTypes.number.isRequired
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createInvestment }, dispatch))
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles)(InvestibleInvest)));
