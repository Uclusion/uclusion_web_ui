import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Modal from '@material-ui/core/Modal'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'


const styles = theme => ({
  paper: {
    position: 'absolute',
    width: theme.spacing.unit * 50,
    top: '50%',
    left: '50%',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
  },

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
    super(props);
    this.state = {...props};

  }

  handleInvest = () => {
    //do something smart
  }


  validateQuantityToInvest = (quantity) => {
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
      <Modal open={this.props.open} onClose={this.props.onClose}>
        <div className={classes.paper}>
        <Typography>
          Some text with the quantity available and minimum investment amount
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
          <Button onClick={this.props.onClose}>i18nCancel</Button>
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