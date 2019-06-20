import React from 'react';
import { connect } from 'react-redux';
import { DeleteForever } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import { withMarketId } from '../../components/PathProps/MarketId';
import { deleteMarketCategory } from '../../api/markets';

class CategoryDelete extends React.Component {
  constructor(props) {
    super(props);
    this.doDelete = this.doDelete.bind(this);
  }

  doDelete() {
    const { dispatch, name, marketId } = this.props;
    deleteMarketCategory(name, marketId, dispatch);
  }

  render() {
    const { intl } = this.props;
    return (
      <Tooltip title={intl.formatMessage({ id: 'categoriesDeleteTooltip' })}>
        <IconButton onClick={() => this.doDelete()}>
          <DeleteForever />
        </IconButton>
      </Tooltip>
    );
  }
}

CategoryDelete.propTypes = {
  dispatch: PropTypes.func.isRequired,
  investible: PropTypes.object, //eslint-disable-line
  name: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return { ...state };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(withMarketId(CategoryDelete))));
