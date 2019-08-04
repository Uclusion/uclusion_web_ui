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
  DialogTitle, Tooltip,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import { deleteInvestible } from '../../api/marketInvestibles';

class InvestibleDelete extends React.PureComponent {
  state = {
    promptDeleteInvestible: false,
  };

  doDelete = () => {
    const { dispatch, investible, onCloseDetail } = this.props;
    deleteInvestible(investible.id, investible.market_id, dispatch)
      .then(() => {
        this.handleCloseDialog();
        onCloseDetail();
      });
  };

  showPrompt = () => {
    this.setState({ promptDeleteInvestible: true });
  };

  handleCloseDialog = () => {
    this.setState({ promptDeleteInvestible: false });
  };

  render() {
    const { promptDeleteInvestible } = this.state;
    const { intl, investible } = this.props;
    return (
      <span>
        <Tooltip title={intl.formatMessage( { id: 'investiblesDeleteToolTip'} )}>
          <IconButton onClick={this.showPrompt}>
          <DeleteForever />
        </IconButton>
        </Tooltip>
        <Dialog
          open={promptDeleteInvestible}
          onClose={this.handleCloseDialog}
        >
          <DialogTitle>
            {intl.formatMessage({ id: 'investiblesDeleteTitle' }, { title: investible.name })}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {intl.formatMessage({ id: 'investiblesDeleteWarning' })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseDialog} color="primary">
              {intl.formatMessage({ id: 'investiblesDeleteCancel' })}
            </Button>
            <Button onClick={this.doDelete} color="primary">
              {intl.formatMessage({ id: 'investiblesDeleteConfirm' })}
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
  onCloseDetail: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired, //eslint-disable-line
};

function mapStateToProps() {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(InvestibleDelete)));
