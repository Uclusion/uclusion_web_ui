import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Modal from '@material-ui/core/Modal'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'


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

class InvestModal extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      quantityToInvest: this.props.minInvestment
    }
  }

  handleInvest = () => {
    //do something smart
  }

  handleCancel = () => {
    this.props.onClose()
  }

  validateQuantityToInvest = (quantity) => {
    if (quantity < this.props.minInvestment) {
      return false
    }
    return quantity <= this.props.sharesAvailable
  }

  handleChange = (name) => (event) => {
    let value = event.target.value
    this.validateQuantityToInvest(value)
    //do some UI stuff here to handle erroneous input
    this.setState({
      [name]: event.target.value,
    })
  }

  render () {
    const {classes} = this.props
    return (
      <Modal open={this.props.investOpen} onClose={this.props.onClose}>
        <div>
        <Typography>
          Some text with the quanity available and minimum investment amount
        </Typography>
        <form className={classes.container} noValidate autoComplete="off">
          <TextField
            id="quantityToInvest"
            label="i18n Quantity to Invest"
            className={classes.textField}
            value={this.state.name}
            onChange={this.handleChange('quantityToInvest')}
            type="number"
            margin="normal"
          />
          <Button onClick={this.handleInvest}>i18nInvest</Button>
          <Button>i18nCancel</Button>
        </form>
        </div>
      </Modal>
    )
  }
}

InvestModal.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(InvestModal);