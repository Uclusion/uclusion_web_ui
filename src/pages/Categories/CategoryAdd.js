import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { createMarketCategory } from '../../store/Markets/actions';

const styles = theme => ({
  form: {
    display: 'flex',
    alignItems: 'flex-end',
    padding: theme.spacing.unit * 2,
  },
  textField: {
    flex: 1,
    maxWidth: 400,
    marginRight: theme.spacing.unit * 2,
  },
  addButton: {
    minWidth: 80,
    height: 36,
  },
});

class CategoryAdd extends React.Component {
  state = {
    title: '',
  };

  handleChange = name => (event) => {
    const { value } = event.target;
    this.setState({
      [name]: value,
    });
  }

  addOnClick = (marketId) => {
    const { dispatch } = this.props;
    const { title } = this.state;
    const payload = { marketId, name: title };
    dispatch(createMarketCategory(payload));
  };

  render() {
    const {
      classes,
      intl,
      marketId,
    } = this.props;
    const { title } = this.state;
    const canAdd = !!title;

    return (
      <form className={classes.form} noValidate autoComplete="off">
        <TextField
          className={classes.textField}
          // InputProps={{ className: classes.textInput }}
          id="category"
          label={intl.formatMessage({ id: 'categoryLabel' })}
          value={title}
          onChange={this.handleChange('title')}
        />
        <Button
          className={classes.addButton}
          variant="contained"
          color="primary"
          disabled={!canAdd}
          onClick={() => this.addOnClick(marketId)}
        >
          {intl.formatMessage({ id: 'addButton' })}
        </Button>
      </form>
    );
  }
}

CategoryAdd.propTypes = {
  marketId: PropTypes.string.isRequired,
};

function mapDispatchToProps(dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createMarketCategory }, dispatch));
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, { withTheme: true })(CategoryAdd)));
