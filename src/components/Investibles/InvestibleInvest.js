import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { bindActionCreators } from 'redux';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Info from '@material-ui/icons/Info';
import { createInvestment } from '../../store/MarketInvestibles/actions';

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
    };
  }

  handleInvest = () => {
    const {
      investibleId,
      teamId,
      marketId,
      dispatch,
    } = this.props;
    const { quantityToInvest } = this.state;
    const quantity = parseInt(quantityToInvest, 10);
    dispatch(createInvestment({
      investibleId,
      teamId,
      marketId,
      quantity,
    }));
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
      sharesAvailable,
      currentUserInvestment,
    } = this.props;
    const { quantityToInvest } = this.state;
    const investEnabled = this.validateQuantityToInvest(parseInt(quantityToInvest, 10));

    return (
      <div>
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
            href="https://uclusion.zendesk.com/hc/en-us/articles/360026659811"
            target="_blank"
            rel="noopener"
          >
            <Info />
          </IconButton>
        </form>
        <Typography className={classes.availableShares}>
          *
          {' '}
          {currentUserInvestment > 0 && `* ${intl.formatMessage({ id: 'userInvestedShares' }, { shares: currentUserInvestment })}`}
        </Typography>
      </div>
    );
  }
}

InvestibleInvest.propTypes = {
  classes: PropTypes.object.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  sharesAvailable: PropTypes.number.isRequired,
};

function mapDispatchToProps(dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createInvestment }, dispatch));
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles)(InvestibleInvest)));
