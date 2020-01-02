import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { deleteInvestible } from '../../../api/investibles';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';

function DeleteInvestibleActionButton(props) {
  const { investibleId, marketId } = props;
  const intl = useIntl();
  const history = useHistory();

  function deleteInvestibleAction() {
    return deleteInvestible(marketId, investibleId)
      .then(() => navigate(history, formMarketLink(marketId)));
  }

  return (
    <SpinBlockingSidebarAction
      marketId={marketId}
      icon={<DeleteForeverIcon />}
      label={intl.formatMessage({ id: 'investibleDeleteLabel' })}
      onClick={deleteInvestibleAction}
    />
  );
}

DeleteInvestibleActionButton.propTypes = {
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default DeleteInvestibleActionButton;
