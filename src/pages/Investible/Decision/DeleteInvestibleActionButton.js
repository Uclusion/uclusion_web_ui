import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever'
import { deleteInvestible } from '../../../api/investibles'
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions'
import SpinningTooltipIconButton from '../../../components/SpinBlocking/SpinningTooltipIconButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

function DeleteInvestibleActionButton(props) {
  const { investibleId, marketId, groupId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
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
      icon={<DeleteForeverIcon />}
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
