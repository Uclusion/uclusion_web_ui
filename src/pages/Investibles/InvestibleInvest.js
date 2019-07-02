import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Info from '@material-ui/icons/Info';
import { createInvestment } from '../../api/marketInvestibles';
import HelpMovie from '../../components/ModalMovie/HelpMovie';

const styles = theme => ({

  container: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit * 2,
    width: 100,
  },
  investButton: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  availableShares: {
    fontSize: 14,
    paddingLeft: theme.spacing.unit,
  },
  button: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit * 2,
    padding: 0,
  },
});

class InvestibleInvest extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      ...props,
      quantityToInvest: '',
      showInvestHelp: false,
    };
  }

  handleInvest = () => {
    const {
      investibleId,
      teamId,
      dispatch,
    } = this.props;
    const { quantityToInvest } = this.state;
    const quantity = parseInt(quantityToInvest, 10);
    createInvestment(teamId, investibleId, quantity, dispatch);
    this.setState({ ...this.props, quantityToInvest: '' });
  };

  validateQuantityToInvest = quantity => (quantity <= this.props.sharesAvailable) && (quantity > 0)

  handleChange = name => (event) => {
    const { value } = event.target;
    let valid = true;
    if (name === 'quantityToInvest') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && (numValue < 0 || numValue > this.props.sharesAvailable)) {
        valid = false;
      }
    }

    if (valid) {
      this.setState({
        [name]: value,
      });
    }
  };

  render() {
    const {
      classes,
      intl,
      currentUserInvestment,
    } = this.props;
    const { quantityToInvest, showInvestHelp } = this.state;
    const investEnabled = this.validateQuantityToInvest(parseInt(quantityToInvest, 10));

    return (
      <div>
        <HelpMovie name="investHelp" open={showInvestHelp} onClose={() => this.setState({ showInvestHelp: false })} dontAutoOpen />
        <Typography>
          {intl.formatMessage({ id: 'investModalText' })}
        </Typography>
        <form className={classes.container} noValidate autoComplete="off">
          <TextField
            id="quantityToInvest"
            label={intl.formatMessage({ id: 'investModalQuantityLabel' })}
            className={classes.textField}
            margin="normal"
            type="number"
            value={quantityToInvest}
            onChange={this.handleChange('quantityToInvest')}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  style={{ paddingBottom: 4 }}
                  position="start"
                >
                  Ȗ
                </InputAdornment>
              ),
            }}
          />
          <Button
            className={classes.investButton}
            variant="contained"
            color="primary"
            disabled={!investEnabled}
            onClick={this.handleInvest}
          >
            {intl.formatMessage({ id: 'investButton' })}
          </Button>
          <IconButton
            name="investinfo"
            aria-label="Invest Help"
            className={classes.button}
            color="primary"
            onClick={(event) => {
              event.preventDefault();
              this.setState({ showInvestHelp: true });
            }}
          >
            <Info />
          </IconButton>
        </form>
        <Typography className={classes.availableShares}>
          {currentUserInvestment > 0 && `* ${intl.formatMessage({ id: 'userInvestedShares' }, { shares: currentUserInvestment })}`}
        </Typography>
      </div>
    );
  }
}

InvestibleInvest.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  investibleId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  sharesAvailable: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired, //eslint-disable-line
  currentUserInvestment: PropTypes.number.isRequired,
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles)(InvestibleInvest)));
