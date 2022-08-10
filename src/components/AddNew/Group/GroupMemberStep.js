import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import StepButtons from '../StepButtons'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import AddNewUsers from '../../../pages/Dialog/UserManagement/AddNewUsers'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'

function GroupMembersStep(props) {
  const { updateFormData, formData, marketId } = props;
  const [marketState] = useContext(MarketsContext);
  const market = getMarket(marketState, marketId);
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  //TODO If only one person in market then add group just pops up modal saying must add to market before create group
  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Invite members to your group.
      </Typography>
      <AddNewUsers market={market} isAddToGroup setToAddClean={(value) => updateFormData({toAddClean: value})} />
      <div className={classes.borderBottom} />
      <StepButtons {...props} validForm={validForm} showFinish={true} />
    </div>
    </WizardStepContainer>
  );
}

GroupMembersStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

GroupMembersStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default GroupMembersStep;