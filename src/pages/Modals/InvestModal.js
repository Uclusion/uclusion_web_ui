import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Modal from '@material-ui/core/Modal'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import { connect } from 'react-redux'
import { injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { createInvestment } from '../../containers/Investibles/actions'


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
    this.handleInvest = this.handleInvest.bind(this);
    this.validateQuantityToInvest = this.validateQuantityToInvest.bind(this);
  }

  handleInvest = () => {
    const {investibleId, marketId, onClose} = this.props;
    let quantity = parseInt(this.state['quantityToInvest'], 10);
    this.props.dispatch(createInvestment({
      investibleId,
      marketId,
      quantity
    }))
    onClose();
  }


  validateQuantityToInvest = (quantity) => {
    return quantity <= this.props.sharesAvailable
  }

  handleChange = (name) => (event) => {
    //let value = event.target.value
      //do some UI stuff here to handle erroneous input
      this.setState({
        [name]: event.target.value,
      })
  }

  render () {
    const {classes, open, onClose, intl} = this.props
    return (
      <Modal open={open} onClose={onClose}>
        <div className={classes.paper}>
        <Typography>
          {intl.formatMessage({id:'investModalText'})}
        </Typography>
        <form className={classes.container} noValidate autoComplete="off">
          <TextField
            id="quantityToInvest"
            label={intl.formatMessage({id: 'investModalQuantityLabel'})}
            className={classes.textField}
            value={this.state.quantityToInvest}
            onChange={this.handleChange('quantityToInvest')}
            type="number"
            margin="normal"
          />
          <Button onClick={this.handleInvest}>{intl.formatMessage({id:'investButton'})}</Button>
          <Button onClick={onClose}>{intl.formatMessage({id:'cancelButton'})}</Button>
        </form>
        </div>
      </Modal>
    )
  }
}

InvestModal.propTypes = {
  classes: PropTypes.object.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createInvestment }, dispatch))
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles)(InvestModal)));
