import React from 'react';
import { connect } from 'react-redux';
import { DeleteForever } from '@material-ui/icons';
import { IconButton } from "@material-ui/core";
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import { deleteMarketInvestible } from '../../store/MarketInvestibles/actions';

class InvestibleDelete extends React.PureComponent {
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
    return <IconButton onClick={() => this.doDelete()} ><DeleteForever /></IconButton>;
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
