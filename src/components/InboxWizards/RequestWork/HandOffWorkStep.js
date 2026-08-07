import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import PokeAIButton from '../../Buttons/PokeAIButton';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { stripHTML } from '../../../utils/stringFunctions';
import { QUESTION_TYPE, TODO_TYPE } from '../../../constants/comments';

// T-all-2345: the same work the AI's find_work sees, computed from context providers -
// view-level open bugs and questions plus jobs in a stage that allows work
export function getHandOffWorkList(commentsState, investiblesState, marketStagesState, marketId) {
  const comments = getMarketComments(commentsState, marketId) || [];
  const commentItems = comments.filter((comment) => !comment.investible_id && !comment.resolved &&
    comment.is_visible !== false && [TODO_TYPE, QUESTION_TYPE].includes(comment.comment_type))
    .map((comment) => ({ name: stripHTML(comment.body), ticketCode: comment.ticket_code }));
  const investibles = getMarketInvestibles(investiblesState, marketId) || [];
  const jobItems = investibles.map((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const stage = getFullStage(marketStagesState, marketId, marketInfo.stage) || {};
    if (!stage.allows_investment && !stage.assignee_enter_only && !stage.move_on_comment) {
      return undefined;
    }
    return { name: inv.investible.name, ticketCode: marketInfo.ticket_code };
  }).filter((item) => item && item.ticketCode);
  return commentItems.filter((item) => item.ticketCode).concat(jobItems);
}

function HandOffWorkStep(props) {
  const { message } = props;
  const classes = wizardStyles();
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const { market_id: marketId } = message;
  const workList = getHandOffWorkList(commentsState, investiblesState, marketStagesState, marketId);

  function myOnFinish() {
    // Not an UNREAD type so the row must be force deleted to leave the inbox
    removeWorkListItem(message, messagesDispatch, undefined, true);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        The AI has no work
      </Typography>
      {_.isEmpty(workList) && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Nothing is currently available to hand it - create a job, bug, or question first.
        </Typography>
      )}
      {!_.isEmpty(workList) && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Poke AI on an item below to hand it over - the same as sending Start from that item.
        </Typography>
      )}
      {workList.map((item) => (
        <div key={item.ticketCode} style={{ display: 'flex', alignItems: 'center', paddingBottom: '0.25rem' }}>
          <PokeAIButton iconOnly marketId={marketId} ticketCode={item.ticketCode}
                        id={`requestWork${item.ticketCode}`}
                        onPoked={myOnFinish} />
          <Typography style={{ marginLeft: '0.5rem' }}>
            {item.name}
          </Typography>
        </div>
      ))}
      <div style={{marginBottom: '1rem'}}/>
      <WizardStepButtons
        {...props}
        focus
        showNext={false}
        showTerminate
        onFinish={myOnFinish}
        terminateLabel="notificationDelete"
      />
    </WizardStepContainer>
  );
}

HandOffWorkStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default HandOffWorkStep;
