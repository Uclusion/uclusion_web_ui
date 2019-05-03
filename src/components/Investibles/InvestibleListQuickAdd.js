import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Button, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createMarketInvestible } from '../../store/MarketInvestibles/actions';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import withAppConfigs from '../../utils/withAppConfigs';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import InputAdornment from '@material-ui/core/InputAdornment';

const styles = theme => ({

  container: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: theme.spacing.unit,
  },
  textField: {
    margin: 0,
    marginBottom: theme.spacing.unit,
  },
  textInput: {
    height: 40,
  },
  actionContainer: {
    display: 'flex',
    padding: theme.spacing.unit * 2,
    justifyContent: 'space-between',
  },
  actionButton: {
    maxWidth: 160,
  },

});

class InvestibleListQuickAdd extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {title: '', description: '' };
    this.handleChange = this.handleChange.bind(this);
    this.addOnClick = this.addOnClick.bind(this);
    this.validateAddState = this.validateAddState.bind(this);
  }

  handleChange = name => (event) => {
    const value = event.target.value;
    this.setState({
      [name]: value,
    });
  };

  addOnClick = (addSubmitOnClick) => {
    const {
      dispatch, marketId, teamId, category, userPermissions, appConfig
    } = this.props;

    const { title, description, quantityToInvest } = this.state;
    const { canInvest } = userPermissions;
    const payload = {
      marketId, category, teamId, canInvest, title, description, quantity: parseInt(quantityToInvest, 10),
    };
    if (description.length === 0) {
      sendIntlMessage(ERROR, { id: 'investibleDescriptionRequired' });
      return;
    }
    if (description.length > appConfig.maxRichTextEditorSize) {
      sendIntlMessage(ERROR, { id: 'investibleDescriptionTooManyBytes' });
      return;
    }
    dispatch(createMarketInvestible(payload));
    addSubmitOnClick();
    this.setState({ title: '', description: '', quantityToInvest: 1 });
  };

  validateAddState = () => {
    const { title, description, quantityToInvest } = this.state;
    const { userPermissions } = this.props;
    const { canInvest } = userPermissions;
    // console.log(description);
    const quantityValid = (!canInvest) || (quantityToInvest > 0);
    return title && description && quantityValid;
  };

  render() {
    const {
      classes,
      visible,
      intl,
      addSubmitOnClick,
      addCancelOnClick,
      userPermissions,
    } = this.props;

    const { canInvest } = userPermissions;

    const { description, quantityToInvest, title } = this.state;
    if (!visible) {
      return null;
    }

    const addEnabled = this.validateAddState();

    return (
      <div>
        <Paper className={classes.container}>
          <TextField
            value={title}
            className={classes.textField}
            InputProps={{ className: classes.textInput, maxLength: 255 }}
            id="title"
            placeholder={intl.formatMessage({ id: 'titleLabel' })}
            defaultValue=""
            margin="normal"
            fullWidth
            onChange={this.handleChange('title')}
          />
          <HtmlRichTextEditor value={description} placeHolder={intl.formatMessage({ id: 'descriptionBody' })} onChange={this.handleChange('description')} />
          {canInvest && (<TextField
            id="quantityToInvest"
            label={intl.formatMessage({ id: 'investibleAddInvestLabel' })}
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
          />)}
        </Paper>
        <div className={classes.actionContainer}>
          <Button
            className={classes.actionButton}
            variant="contained"
            fullWidth
            color="primary"
            disabled={!addEnabled}
            onClick={() => this.addOnClick(addSubmitOnClick)}
          >
            {intl.formatMessage({ id: 'addButton' })}
          </Button>
          <Button
            className={classes.actionButton}
            variant="contained"
            fullWidth
            onClick={() => addCancelOnClick()}
          >
            {intl.formatMessage({ id: 'cancelButton' })}
          </Button>
        </div>
      </div>
    );
  }
}

InvestibleListQuickAdd.propTypes = {
  category: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  addCancelOnClick: PropTypes.func.isRequired,
  addSubmitOnClick: PropTypes.func.isRequired,
  userPermissions: PropTypes.object.isRequired,
};

function mapDispatchToProps(dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createMarketInvestible }, dispatch));
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, { withTheme: true })(withUserAndPermissions(withAppConfigs(InvestibleListQuickAdd)))));
