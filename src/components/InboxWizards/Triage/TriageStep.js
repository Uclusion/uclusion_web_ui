import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import { RED_LEVEL } from '../../../constants/notifications';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import MarketTodos from '../../../pages/Dialog/Planning/MarketTodos';
import {
  formatGroupLinkWithSuffix,
  MARKET_TODOS_HASH,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import Link from '@material-ui/core/Link';
import { useHistory } from 'react-router';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

function TriageStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [groupState] = useContext(MarketGroupsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const intl = useIntl();
  const history = useHistory();
  const commentRoot = getComment(commentState, marketId, commentId) || {};
  const { group_id: groupId } = commentRoot;
  const group = getGroup(groupState, marketId, groupId) || {};
  const { name: groupName } = group;
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.group_id === groupId && !comment.resolved && !comment.deleted && !comment.investible_id &&
    comment.notification_type === RED_LEVEL);
  const classes = wizardStyles();
  const pathToBugs = formatGroupLinkWithSuffix(MARKET_TODOS_HASH, marketId, groupId);
  const marketInvestibles = getMarketInvestibles(investiblesState, marketId) || [];
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const activeInvestibles = marketInvestibles.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const { assigned, stage } = marketInfo;
    const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
    return assigned?.includes(myPresence.id) && (fullStage.appears_in_context && fullStage.allows_tasks) ;
  });

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'CriticalBugTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Click on a row to assign with the Move button, resolve, reply, or change from critical.
      </Typography>
      <h2 id="tasksOverview">
        Critical <Link href={pathToBugs} onClick={(event) => {
        preventDefaultAndProp(event);
        navigate(history, pathToBugs);
      }}>bugs</Link> for view {groupName}
      </h2>
      <MarketTodos comments={comments} marketId={marketId} groupId={groupId} message={message}
                   sectionOpen={true} hidden={false} activeInvestibles={activeInvestibles}
                   setSectionOpen={() => {}} group={group} isInbox openDefaultId={commentId} />
    </WizardStepContainer>
  );
}

TriageStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

TriageStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default TriageStep;