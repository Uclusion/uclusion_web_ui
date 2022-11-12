import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { ISSUE_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments'
import JobApproveStep from './JobApproveStep'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import _ from 'lodash'
import { formCommentLink } from '../../../utils/marketIdPathFunctions'

function ActionApprovalStep(props) {
  const {marketId, investibleId, formData, onFinish} = props;
  const classes = useContext(WizardStylesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible: myInvestible } = inv || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId } = marketInfo;
  const { isApprove, commentType } = formData;

  if (isApprove) {
    return <JobApproveStep {...props} groupId={groupId}/>;
  }

  if (_.isEmpty(commentType)) {
    return React.Fragment;
  }

  function onSave(comment) {
    const link = formCommentLink(marketId, groupId, investibleId, comment.id);
    onFinish({ link });
  }

  let introText = "What is your question?";
  if (commentType === ISSUE_TYPE) {
    introText = "What is your issue?"
  } else if (commentType === SUGGEST_CHANGE_TYPE) {
    introText = "What is your suggestion?";
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
        nameDifferentiator="actionApproval"
      />
    </div>
    </WizardStepContainer>
  );
}

ActionApprovalStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ActionApprovalStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ActionApprovalStep;