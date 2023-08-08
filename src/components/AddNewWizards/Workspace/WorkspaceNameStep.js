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
import { pushMessage } from '../../../utils/MessageBusUtils';
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../api/versionedFetchUtils';
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import TokenStorageManager from '../../../authorization/TokenStorageManager';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { accountUserRefresh } from '../../../contexts/AccountContext/accountContextReducer';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import { formMarketLink } from '../../../utils/marketIdPathFunctions';
import { NAME_MAX_LENGTH } from '../../TextFields/NameField';
import { TOKEN_TYPE_MARKET } from '../../../api/tokenConstants';

function WorkspaceNameStep (props) {
  const { updateFormData, formData } = props;
  //const intl = useIntl();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, userDispatch] = useContext(AccountContext);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function onNext () {
    const { name } = formData;
    const marketInfo = {
      name,
    };
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
        userDispatch(accountUserRefresh(user));
        addMarketToStorage(marketsDispatch, market);
        addGroupsToStorage(groupsDispatch, () => {}, { [createdMarketId]: [group]});
        pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, stageDetails: {[createdMarketId]: stages }});
        addPresenceToMarket(presenceDispatch, createdMarketId, presence);
        const tokenStorageManager = new TokenStorageManager();
        return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, createdMarketId, token)
          .then(() => {
            updateFormData({
              marketId: market.id,
              link: formMarketLink(market.id, market.id),
              marketToken: market.invite_capability,
            });
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
        <Typography className={classes.introSubText} variant="subtitle1">
          It's best to pick something everyone will recognize.
        </Typography>
        <OutlinedInput
          id="workspaceName"
          className={classes.input}
          value={value}
          onChange={onNameChange}
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
        <WizardStepButtons {...props} showStartOver={false} onNext={onNext} validForm={validForm}/>
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