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

    const { title, description } = this.state;
    const { canInvest } = userPermissions;
    const payload = {
      marketId, category, teamId, canInvest, title, description,
    };
    if (description.length > appConfig.maxRichTextEditorSize){
      sendIntlMessage(ERROR, { id: 'investibleDescriptionTooManyBytes' });
      return;
    }
    dispatch(createMarketInvestible(payload));
    addSubmitOnClick();
    this.setState({ title: '', description: '' });
  };


  render() {
    const {
      classes,
      visible,
      intl,
      addSubmitOnClick,
      addCancelOnClick,
    } = this.props;

    const { description } = this.state;
    if (!visible) {
      return null;
    }
    return (
      <div>
        <Paper className={classes.container}>
          <TextField
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
        </Paper>
        <div className={classes.actionContainer}>
          <Button
            className={classes.actionButton}
            variant="contained"
            fullWidth
            color="primary"
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
};

function mapDispatchToProps(dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createMarketInvestible }, dispatch));
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, { withTheme: true })(withUserAndPermissions(withAppConfigs(InvestibleListQuickAdd)))));
