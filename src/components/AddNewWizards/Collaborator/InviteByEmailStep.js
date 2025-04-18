import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import EmailEntryBox, { getEmailList } from '../../Email/EmailEntryBox';
import WizardStepButtons from '../WizardStepButtons';
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer'
import { inviteParticipants } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function InviteByEmailStep(props) {
  const { formData, finish, marketId, updateFormData, displayFromOther } = props;
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const inMarketEmailList = marketPresences.map((presence) => presence.email);
  const { isValid } = formData;
  console.debug(`is valid is ${isValid}`);

  function myOnFinish(isOther=false){
    const emails = getEmailList(marketId);
    if (!_.isEmpty(emails)) {
      return inviteParticipants(marketId, emails).then((result) => {
        setOperationRunning(false);
        marketPresencesDispatch(addMarketPresences(marketId, result));
      });
    }
    if (!isOther) {
      finish();
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} variant="h6">
        Who should be added by email?
      </Typography>
      {displayFromOther && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Use the middle option to choose participants already in other workspaces.
        </Typography>
      )}
      <EmailEntryBox marketId={marketId} alreadyInList={inMarketEmailList}
                     setIsValid={(isValid) => updateFormData({ isValid })}
                     placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com"/>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={isValid}
        nextLabel="OnboardingWizardFinish"
        onNextDoAdvance={isValid === true}
        spinOnClick={isValid === true}
        onNextSkipStep={displayFromOther}
        showSkip={false}
        showLink={true}
        onNext={myOnFinish}
        formData={formData}
        marketToken={market.invite_capability}
        showOtherNext={displayFromOther}
        otherSpinOnClick={isValid === true}
        onOtherNext={() => myOnFinish(true)}
        otherNextLabel="OnboardingWizardAddOther"
      />
    </WizardStepContainer>
  );
}

InviteByEmailStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InviteByEmailStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InviteByEmailStep;