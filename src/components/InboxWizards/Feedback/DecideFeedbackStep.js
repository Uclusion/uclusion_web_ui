import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import Voting from '../../../pages/Investible/Decision/Voting';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { JUSTIFY_TYPE } from '../../../constants/comments';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_APPROVERS_WIZARD_TYPE } from '../../../constants/markets';

function DecideFeedbackStep(props) {
  const { marketId, investibleId, message, updateFormData, formData } = props;
  const intl = useIntl();
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const market = getMarket(marketsState, marketId) || {};
  const investibleComments = getInvestibleComments(investibleId, marketId, commentState);
  const investmentReasons = investibleComments.filter((comment) => {
    return comment.comment_type === JUSTIFY_TYPE && comment.investible_id === message.investible_id;
  });
  const classes = wizardStyles();
  const { useCompression } = formData;

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'startJobQ'})}
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} removeActions />
      <Voting
        investibleId={message.investible_id}
        marketPresences={marketPresences}
        investmentReasons={investmentReasons}
        showExpiration={true}
        expirationMinutes={market.investment_expiration * 1440}
        yourPresence={marketPresences.find((presence) => presence.current_user)}
        market={market}
        isInbox
        toggleCompression={() => updateFormData({useCompression: !useCompression})}
        useCompression={useCompression}
      />
      <div className={classes.marginBottom}/>
      <WizardStepButtons
        {...props}
        focus
        onFinish={myOnFinish}
        nextLabel="addApproversLabel"
        spinOnClick={false}
        onNextDoAdvance={false}
        onNext={() => navigate(history,
          formWizardLink(JOB_APPROVERS_WIZARD_TYPE, marketId, investibleId, undefined, undefined,
            message.type_object_id))}
        showOtherNext
        isOtherFinal={false}
        otherSpinOnClick={false}
        otherNextLabel="RejectAssignment"
        showTerminate={getShowTerminate(message)}
        terminateLabel={getLabelForTerminate(message)}
      />
    </WizardStepContainer>
  );
}

DecideFeedbackStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideFeedbackStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideFeedbackStep;