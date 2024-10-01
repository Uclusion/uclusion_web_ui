import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { updateMarket } from '../../../api/markets';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { ADD_COLLABORATOR_WIZARD_TYPE } from '../../../constants/markets';

function WorkspaceMembersStep(props) {
  const { formData } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const { marketId: addToMarketId, link } = formData;

  function useSinglePersonMode() {
    return updateMarket(
      addToMarketId,
      null,
      null,
      null,
      true
    ).then(market => {
      addMarketToStorage(marketsDispatch, market);
      setOperationRunning(false);
      navigate(history, link);
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Invite people to this workspace?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Single person mode removes collaboration features until a collaborator is added or the mode is turned off in
        settings.
      </Typography>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        showSkip
        onSkip={() => navigate(history, link)}
        onNext={() => navigate(history,
          `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${addToMarketId}`)}
        nextLabel="addMoreCollaborators"
        onNextDoAdvance={false}
        isFinal
        showOtherNext
        otherNextLabel="singlePersonMode"
        isOtherFinal
        onOtherDoAdvance={false}
        onOtherNext={useSinglePersonMode}
      />
    </div>
    </WizardStepContainer>
  );
}

WorkspaceMembersStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

WorkspaceMembersStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default WorkspaceMembersStep;