import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { createPlanning } from '../../../api/markets';
import WizardStepButtons from '../WizardStepButtons';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { addGroupsToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import TokenStorageManager from '../../../authorization/TokenStorageManager';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { accountUserRefresh } from '../../../contexts/AccountContext/accountContextReducer';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { NAME_MAX_LENGTH } from '../../TextFields/NameField';
import { TOKEN_TYPE_MARKET } from '../../../api/tokenConstants';
import { DEMO_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import { updateMarketStagesFromNetwork } from '../../../contexts/MarketStagesContext/marketStagesContextReducer';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { processBanned } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer';
import { OnboardingState } from '../../../contexts/AccountContext/accountUserContextHelper';
import { useHistory } from 'react-router';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function WorkspaceNameStep (props) {
  const { updateFormData, formData } = props;
  const history = useHistory();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, userDispatch] = useContext(AccountContext);
  const [, stagesDispatch] = useContext(MarketStagesContext);
  const [userState] = useContext(AccountContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const isDemoOn = userState?.user?.onboarding_state !== OnboardingState.FirstMarketJoined;

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function onSinglePersonCreate() {
    return onNext(true);
  }

  function onNext(isSinglePersonMode = false) {
    const { name } = formData;
    const marketInfo = {
      name,
    };
    if (isSinglePersonMode) {
      marketInfo.market_sub_type = 'SINGLE_PERSON';
    }
    return createPlanning(marketInfo)
      .then((marketDetails) => {
        const {
          market,
          presence,
          stages,
          token,
          group,
          market_creator: user
        } = marketDetails;
        const createdMarketId = market.id;
        if (user) {
          userDispatch(accountUserRefresh(user));
        }
        addMarketToStorage(marketsDispatch, market);
        addGroupsToStorage(groupsDispatch, () => {}, { [createdMarketId]: [group]});
        stagesDispatch(updateMarketStagesFromNetwork({[createdMarketId]: stages }));
        addPresenceToMarket(presenceDispatch, createdMarketId, presence);
        const demo = marketsState?.marketDetails?.find((market) => market.market_type === PLANNING_TYPE &&
          market.object_type === DEMO_TYPE);
        if (!_.isEmpty(demo)){
          presenceDispatch(processBanned([demo.id]));
        }
        const tokenStorageManager = new TokenStorageManager();
        return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, createdMarketId, token)
          .then(() => {
            const link = formMarketLink(market.id, market.id);
            if (isSinglePersonMode) {
              // Should fix up finish to be invoked but currently is not
              setOperationRunning(false);
              navigate(history, link);
            } else {
              updateFormData({
                marketId: market.id,
                link,
                marketToken: market.invite_capability,
              });
            }
          });
      });

  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText}>
          What do you want to call your workspace?
        </Typography>
        {isDemoOn && (
          <Typography className={classes.introSubText} variant="subtitle1">
            <b>Warning</b>: Creating this workspace <i>ends the demo</i> and removes its workspace.
          </Typography>
        )}
        <Typography className={classes.introSubText} variant="subtitle1">
          Single person mode removes collaboration features until a collaborator is added or the mode is turned off in
          settings.
        </Typography>
        <OutlinedInput
          id="workspaceName"
          className={classes.input}
          value={value}
          onChange={onNameChange}
          autoFocus
          placeholder="Ex: ACME Corp"
          variant="outlined"
          inputProps={{ maxLength : NAME_MAX_LENGTH }}
          endAdornment={
            <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
              {NAME_MAX_LENGTH - (formData?.name?.length ?? 0)}
            </InputAdornment>
          }
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          showStartOver={false}
          nextLabel="createWorkspaceNormal"
          onNext={onNext}
          showOtherNext
          otherNextLabel="createWorkspaceSingleUser"
          onOtherNext={onSinglePersonCreate}
          onOtherDoAdvance={false}
          isOtherFinal
          isFinal={false}
          validForm={validForm}
        />
      </div>
    </WizardStepContainer>
  );
}

WorkspaceNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default WorkspaceNameStep;