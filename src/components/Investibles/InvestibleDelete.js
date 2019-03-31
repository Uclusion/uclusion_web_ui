import React from 'react';
import { connect } from 'react-redux';
import { DeleteForever } from '@material-ui/icons';
import {
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import { deleteMarketInvestible } from '../../store/MarketInvestibles/actions';

class InvestibleDelete extends React.PureComponent {
  state = {
    promptDeleteInvestible: false,
  };

  doDelete = () => {
    const { dispatch, investible, onCloseDetail } = this.props;
    dispatch(deleteMarketInvestible({
      marketId: investible.market_id,
      investibleId: investible.id,
    }));
    this.handleCloseDialog();
    onCloseDetail();
  }

  showPrompt = () => {
    this.setState({ promptDeleteInvestible: true });
  }

  handleCloseDialog = () => {
    this.setState({ promptDeleteInvestible: false });
  }

  render() {
    const { promptDeleteInvestible } = this.state;

    return (
      <span>
        <IconButton
          onClick={this.showPrompt}
        >
          <DeleteForever />
        </IconButton>
        <Dialog
          open={promptDeleteInvestible}
          onClose={this.handleCloseDialog}
        >
          <DialogTitle>
            Delete Investible?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              This cannot be undone. Please make sure you are deleting the right investible.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={this.doDelete} color="primary">
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </span>
    );
  }
}

InvestibleDelete.propTypes = {
  dispatch: PropTypes.func.isRequired,
  investible: PropTypes.object, //eslint-disable-line
  onCloseDetail: PropTypes.func,
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(InvestibleDelete)));
