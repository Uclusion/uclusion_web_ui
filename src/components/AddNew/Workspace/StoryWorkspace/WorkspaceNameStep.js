import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { TextField, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from '../../StepButtons'
import WizardStepContainer from '../../WizardStepContainer';
import { WizardStylesContext } from '../../WizardStylesContext';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext'
import { MarketStagesContext } from '../../../../contexts/MarketStagesContext/MarketStagesContext'
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { CommentsContext } from '../../../../contexts/CommentsContext/CommentsContext'
import { OperationInProgressContext } from '../../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { doCreateStoryWorkspace } from './workspaceCreator'
import { formMarketLink } from '../../../../utils/marketIdPathFunctions'

function WorkspaceNameStep (props) {
  const { updateFormData, formData, parentInvestibleId, parentMarketId } = props;
  const intl = useIntl();
  const value = formData.meetingName || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  function createMarket (formData) {
    const dispatchers = {
      marketStagesDispatch,
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
      commentsDispatch,
      commentsState,
    };
    return doCreateStoryWorkspace(dispatchers, formData, updateFormData, intl)
      .then((marketId) => {
        setOperationRunning(false);
        return ({ ...formData, link: formMarketLink(marketId) });
      })
  }

  function onFinish () {
    return createMarket({ ...formData });
  }

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      meetingName: value
    });
    if (parentInvestibleId) {
      updateFormData({
        parentInvestibleId
      });
    }
    if (parentMarketId) {
      updateFormData({
        parentMarketId
      });
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="body2">
        Great! You just need a name to start a Workspace. After that you can finish immediately or
        look through other options. All of this configuration can be changed at any time.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'WorkspaceWizardMeetingPlaceHolder' })}</label>
      <TextField
        id="workspaceName"
        className={classes.input}
        value={value}
        onChange={onNameChange}
      />
      <div className={classes.borderBottom} />
      <StepButtons {...props} validForm={validForm} onFinish={onFinish} />
    </div>
    </WizardStepContainer>
  );
}

WorkspaceNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default WorkspaceNameStep;