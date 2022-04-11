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
      <Typography className={classes.introText} variant="h6">
        Channels have features for extended efforts. Configuration can be changed at any time from channel settings.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">
        {intl.formatMessage({ id: 'WorkspaceWizardMeetingPlaceHolder' })}
      </label>
      <TextField
        id="workspaceName"
        className={classes.input}
        value={value}
        onChange={onNameChange}
      />
      <div className={classes.borderBottom} />
      <StepButtons {...props} validForm={validForm} onFinish={onFinish} onNext={onFinish}
                   showFinish={false}/>
    </div>
    </WizardStepContainer>
  );
}

WorkspaceNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  isNew: PropTypes.bool
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  isNew: false
};

export default WorkspaceNameStep;