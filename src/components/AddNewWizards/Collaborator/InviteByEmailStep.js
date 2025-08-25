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
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function InviteByEmailStep(props) {
  const { formData, finish, marketId, updateFormData, displayFromOther, allAutonomousViews, isDemoMarket } = props;
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const history = useHistory();
  const market = getMarket(marketsState, marketId) || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const inMarketEmailList = marketPresences.map((presence) => presence.email);
  const { isValid } = formData;
  const isLastStep = !displayFromOther && allAutonomousViews;

  function myOnFinish(){
    const emails = getEmailList(marketId);
    if (!_.isEmpty(emails)) {
      return inviteParticipants(marketId, emails).then((result) => {
        setOperationRunning(false);
        marketPresencesDispatch(addMarketPresences(marketId, result));
        updateFormData({ emails });
        if (isLastStep) {
          // Just go to market or they will see blank page
          navigate(history, formMarketLink(marketId, marketId));
        }
      });
    }
    if (isLastStep) {
      // Just go to market or they will see blank page
      navigate(history, formMarketLink(marketId, marketId));
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} variant="h6">
        Who should be added by email?
      </Typography>
      {isDemoMarket && (
        <Typography className={classes.introSubText} variant="subtitle1">
          <b>Warning</b>: This is a demo workspace and will go away once you start a real one.
        </Typography>
      )}
      <div style={{ marginBottom: '2rem' }} />
      <EmailEntryBox marketId={marketId} alreadyInList={inMarketEmailList}
                     setIsValid={(isValid) => updateFormData({ isValid })}
                     placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com"/>
      <WizardStepButtons
        {...props}
        validForm={isValid === true || (isValid === undefined && displayFromOther)}
        spinOnClick={isValid === true}
        showLink
        onNext={myOnFinish}
        onNextDoAdvance={!isLastStep}
        formData={formData}
        marketToken={market.invite_capability}
        showTerminate
        onTerminate={finish}
        terminateLabel='cancel'
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