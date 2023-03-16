import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { useIntl } from 'react-intl';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useHistory } from 'react-router';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';

function EstimateChangeViewStep(props) {
  const { marketId, investibleId, message } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = wizardStyles();
  const workItemClasses = workListStyles();
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, true);
  const marketInvestible = getInvestible(investiblesState, investibleId) || {};
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const { completion_estimate: daysEstimate } = marketInfo;

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        {message.title}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Estimate changed from {message.text ? intl.formatDate(new Date(message.text)) : 'none'} to {intl.formatDate(daysEstimate)}.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} />
      <WizardStepButtons
        {...props}
        nextLabel="notificationDelete"
        onNext={() => removeWorkListItem(message, workItemClasses.removed, messagesDispatch)}
        spinOnClick={false}
        onFinish={() => navigate(history, formInvestibleLink(marketId, investibleId))}
        terminateLabel="JobWizardGotoJob"
        showTerminate={true}
      />
    </div>
    </WizardStepContainer>
  );
}

EstimateChangeViewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

EstimateChangeViewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default EstimateChangeViewStep;