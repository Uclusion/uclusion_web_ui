import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { createMarketCategory } from '../../api/markets';

const styles = theme => ({
  addBox: {
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
  };

  addOnClick = (marketId) => {
    const { dispatch } = this.props;
    const { title } = this.state;
    createMarketCategory(title, marketId, dispatch);
    this.setState({ title: '' });
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
      <div className={classes.addBox}>
        <TextField
          className={classes.textField}
          inputProps={{ maxLength: 255 }}
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
      </div>
    );
  }
}

CategoryAdd.propTypes = {
  marketId: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, { withTheme: true })(CategoryAdd)));
