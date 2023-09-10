import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription'
import { REPORT_TYPE } from '../../../constants/comments'
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { formInvestibleAddCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';


function JobDescriptionStatusStep(props) {
  const { marketId, investibleId, message } = props;
  const classes = wizardStyles();
  const [commentsState] = useContext(CommentsContext);
  const history = useHistory();
  const intl = useIntl();
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, true);

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'JobStatusTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Adding an estimated date turns off status reminders until that date. Reporting progress turns off reminders for
        a day and can be used to get feedback.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} removeActions />
      <WizardStepButtons
        {...props}
        nextLabel="StatusWizardEstimate"
        isFinal={false}
        spinOnClick={false}
        showOtherNext
        otherNextLabel="StatusWizardReport"
        onOtherNext={() => {
          navigate(history,
            formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, REPORT_TYPE));
        }}
        otherSpinOnClick={false}
        showTerminate={message.is_highlighted}
        terminateLabel="defer"/>
    </WizardStepContainer>
  );
}

JobDescriptionStatusStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStatusStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStatusStep;