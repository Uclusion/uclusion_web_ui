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
import { addPresenceToMarket, changeBanStatus } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import TokenStorageManager from '../../../authorization/TokenStorageManager';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { accountUserRefresh } from '../../../contexts/AccountContext/accountContextReducer';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { NAME_MAX_LENGTH } from '../../TextFields/NameField';
import { TOKEN_TYPE_MARKET } from '../../../api/tokenConstants';
import { ADD_COLLABORATOR_WIZARD_TYPE, DEMO_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import { updateMarketStagesFromNetwork } from '../../../contexts/MarketStagesContext/marketStagesContextReducer';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { OnboardingState } from '../../../contexts/AccountContext/accountUserContextHelper';
import { useHistory } from 'react-router';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { addGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';

function WorkspaceNameStep (props) {
  const { updateFormData, formData } = props;
  const history = useHistory();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [presenceState, presenceDispatch] = useContext(MarketPresencesContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const [, userDispatch] = useContext(AccountContext);
  const [, stagesDispatch] = useContext(MarketStagesContext);
  const [userState] = useContext(AccountContext);
  const [commentsState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const isDemoOn = userState?.user?.onboarding_state !== OnboardingState.FirstMarketJoined;

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function onNext(isSinglePersonMode = true) {
    const { name } = formData;
    const marketInfo = {
      name,
      is_autonomous_group: isSinglePersonMode
    };
    return createPlanning(marketInfo)
      .then((marketDetails) => {
        const {
          market,
          presence,
          stages,
          token,
          group,
          market_creator: user,
          default_members: defaultMembers
        } = marketDetails;
        const createdMarketId = market.id;
        if (user) {
          userDispatch(accountUserRefresh(user));
        }
        addMarketToStorage(marketsDispatch, market);
        addGroupsToStorage(groupsDispatch, { [createdMarketId]: [group]});
        stagesDispatch(updateMarketStagesFromNetwork({[createdMarketId]: stages }));
        addPresenceToMarket(presenceDispatch, createdMarketId, presence);
        groupMembersDispatch(addGroupMembers(createdMarketId, createdMarketId, defaultMembers));
        const demo = marketsState?.marketDetails?.find((market) => market.market_type === PLANNING_TYPE &&
          market.object_type === DEMO_TYPE);
        if (!_.isEmpty(demo) && user){
          changeBanStatus(presenceState, presenceDispatch, demo.id, user.id, true, commentsState);
        }
        const tokenStorageManager = new TokenStorageManager();
        return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, createdMarketId, token)
          .then(() => {
            const link = formMarketLink(market.id, market.id);
            // Should fix up finish to be invoked but currently is not
            setOperationRunning(false);
            navigate(history, link);
            return link;
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
          onNext={onNext}
          validForm={validForm}
          showTerminate={validForm}
          onTerminate={() => navigate(history)}
          terminateLabel='OnboardingWizardGoBack'
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