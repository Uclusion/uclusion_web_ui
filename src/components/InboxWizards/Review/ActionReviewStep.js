import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import { REPORT_TYPE, TODO_TYPE } from '../../../constants/comments'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import _ from 'lodash'
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function ActionReviewStep(props) {
  const {marketId, investibleId, formData, message } = props;
  const classes = wizardStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const workItemClasses = workListStyles();
  const inv = getInvestible(investiblesState, investibleId);
  const { investible: myInvestible } = inv || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId } = marketInfo;
  const { commentType } = formData;

  if (_.isEmpty(commentType)) {
    return React.Fragment;
  }

  function onSave() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  let introText;
  if (commentType === REPORT_TYPE) {
    introText = "What is your review?"
  } else if (commentType === TODO_TYPE) {
    introText = "What task are you adding?";
  }
  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        {introText}
      </Typography>
      <CommentAddBox
        allowedTypes={[commentType]}
        investible={myInvestible}
        marketId={marketId}
        groupId={groupId}
        issueWarningId={'issueWarningPlanning'}
        isInReview={false}
        isStory
        wizardProps={props}
        onSave={onSave}
        nameDifferentiator="actionReview"
      />
    </div>
    </WizardStepContainer>
  );
}

ActionReviewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ActionReviewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ActionReviewStep;