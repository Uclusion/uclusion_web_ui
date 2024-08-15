import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { deleteInvestible } from '../../../api/investibles'
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions'
import SpinningTooltipIconButton from '../../../components/SpinBlocking/SpinningTooltipIconButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import NotificationDeletion from '../../Home/YourWork/NotificationDeletion';

function DeleteInvestibleActionButton(props) {
  const { investibleId, marketId, groupId } = props;
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();

  function deleteInvestibleAction() {
    return deleteInvestible(marketId, investibleId)
      .then(() => {
        setOperationRunning(false);
        navigate(history, formMarketLink(marketId, groupId));
      });
  }

  return (
    <SpinningTooltipIconButton
      id='investibleDelete'
      icon={<NotificationDeletion isRed={operationRunning === false} />}
      translationId="investibleDeleteExplanationLabel"
      onClick={deleteInvestibleAction}
    />
  );
}

DeleteInvestibleActionButton.propTypes = {
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default DeleteInvestibleActionButton;
