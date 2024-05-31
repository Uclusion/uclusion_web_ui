import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { useHistory } from 'react-router';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import JobDescription from '../JobDescription';
import { useIntl } from 'react-intl';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { JUSTIFY_TYPE } from '../../../constants/comments';
import Voting from '../../../pages/Investible/Decision/Voting';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { JOB_APPROVERS_WIZARD_TYPE } from '../../../constants/markets';

function OtherOptionsStep(props) {
  const { marketId, investibleId, groupId, formData, updateFormData, typeObjectId } = props;
  const intl = useIntl();
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const history = useHistory();
  const classes = wizardStyles();
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const market = getMarket(marketsState, marketId) || {};
  const investmentReasons = marketComments.filter((comment) => {
    return comment.comment_type === JUSTIFY_TYPE && comment.investible_id === investibleId;
  });
  const { useCompression } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'otherOptionsQ' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Adding required approvers sends persistent (cannot be dismissed) notifications.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} removeActions/>
      <Voting
        investibleId={investibleId}
        marketPresences={marketPresences}
        investmentReasons={investmentReasons}
        showExpiration={true}
        expirationMinutes={market.investment_expiration * 1440}
        votingAllowed={false}
        yourPresence={marketPresences.find((presence) => presence.current_user)}
        market={market}
        isInbox
        toggleCompression={() => updateFormData({ useCompression: !useCompression })}
        useCompression={useCompression}
      />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        nextLabel="addApproversLabel"
        spinOnClick={false}
        onNextDoAdvance={false}
        onNext={() => navigate(history,
          formWizardLink(JOB_APPROVERS_WIZARD_TYPE, marketId, investibleId, undefined, undefined,
            typeObjectId))}
        showOtherNext
        otherSpinOnClick={false}
        otherNextLabel="RejectAssignment"
        isOtherFinal={false}
      />
    </WizardStepContainer>
  );
}

OtherOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

OtherOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default OtherOptionsStep;