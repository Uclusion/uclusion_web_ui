import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import EmailEntryBox, { getEmailList, setEmailList } from '../../Email/EmailEntryBox';
import WizardStepButtons from '../WizardStepButtons';
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer'
import { inviteParticipants } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { updateMarket } from '../../../api/markets';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function WorkspaceMembersStep(props) {
  const { formData } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const { marketId: addToMarketId } = formData;

  const myOnFinish = () => {
    const emails = getEmailList(addToMarketId);
    if (!_.isEmpty(emails)) {
      return inviteParticipants(addToMarketId, emails).then((result) => {
        setEmailList([], addToMarketId);
        setOperationRunning(false);
        marketPresencesDispatch(addMarketPresences(addToMarketId, result));
      });
    }
    setOperationRunning(false);
  }

  function useSinglePersonMode() {
    return updateMarket(
      addToMarketId,
      null,
      null,
      null,
      true
    ).then(market => {
      addMarketToStorage(marketsDispatch, market);
      const { link } = formData;
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
        Who else needs to be in the workspace?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Single person mode removes two person features until a collaborator is added or the mode is turned off in
        settings.
      </Typography>
      <EmailEntryBox marketId={formData.marketId} placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com" />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        showSkip={false}
        showLink={true}
        onNext={myOnFinish}
        isFinal={false}
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