import React from 'react';
import { connect } from 'react-redux';
import { DeleteForever } from '@material-ui/icons';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import { deleteMarketInvestible } from '../../store/MarketInvestibles/actions';

class InvestibleDelete extends React.Component {
  constructor(props) {
    super(props);
    this.doDelete = this.doDelete.bind(this);
  }

  doDelete() {
    const { dispatch, investible } = this.props;
    dispatch(deleteMarketInvestible({
      marketId: investible.market_id,
      investibleId: investible.id,
    }));
  }

  render() {
    return <DeleteForever onClick={() => this.doDelete()} />;
  }
}

InvestibleDelete.propTypes = {
  dispatch: PropTypes.func.isRequired,
  investible: PropTypes.object,
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(InvestibleDelete)));
