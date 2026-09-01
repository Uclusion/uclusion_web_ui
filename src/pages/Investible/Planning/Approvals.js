import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { IconButton, Tooltip } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { ExpandLess } from '@material-ui/icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router';
import Voting from '../Decision/Voting';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { APPROVAL_WIZARD_TYPE } from '../../../constants/markets';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { calculateInvestibleVoters } from '../../../utils/votingUtils';
import { getVotesForInvestible } from '../../../utils/userFunctions';

function Approvals(props) {
  const {
    displayVotingInput,
    groupId,
    hash,
    hidden,
    investmentReasons,
    investibleId,
    isAssigned,
    isInVoting,
    market,
    marketId,
    marketPresences,
    openInlineWizard,
    search,
    showExpiration,
    visible,
    yourPresence
  } = props;
  const history = useHistory();
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [messagesState] = useContext(NotificationsContext);
  const approvalVoters = calculateInvestibleVoters(investibleId, marketId, marketsState,
    investiblesState, marketPresences, false);
  const opensFromHash = !hidden && (hash?.startsWith('#cv') || hash?.startsWith('#approve'));
  const [approvalsOpen, setApprovalsOpen] = useState(
    isInVoting || !_.isEmpty(approvalVoters) || opensFromHash
  );

  // Reapply the Approvable default when this job enters that stage without making it permanently forced.
  useEffect(() => {
    if (isInVoting) {
      setApprovalsOpen(true);
    }
  }, [isInVoting]);

  // Approval links can arrive while another tab is selected, before this component is mounted.
  useEffect(() => {
    if (visible && opensFromHash) {
      setApprovalsOpen(true);
      history.replace(window.location.pathname + window.location.search);
    }
  }, [history, opensFromHash, visible]);

  // B-all-600: a highlighted notification attached to a rendered vote keeps Approvals visible.
  const approvalsForcedOpen = (messagesState.messages || []).some((message) => message.is_highlighted &&
    !message.deleted && message.voted_list?.some((vote) => vote.investible_id === investibleId &&
      approvalVoters.some((voter) => voter.id === vote.id)));
  const approvalsDisplayOpen = approvalsOpen || approvalsForcedOpen;
  const invested = getVotesForInvestible(marketPresences, investibleId);
  const displayApprovalsBySearch = _.isEmpty(search) ? _.size(invested) : _.size(investmentReasons);

  function toggleApprovals() {
    setApprovalsOpen(!approvalsDisplayOpen);
  }

  if (!visible) {
    return null;
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 id="approvals" style={{ marginBottom: 0, paddingBottom: 0, marginTop: 0, paddingTop: 0 }}>
          <FormattedMessage id="decisionInvestibleOthersVoting"/> {displayVotingInput && investibleId
           && <TooltipIconButton id="newApproval"
              marginLeft="1rem"
              onClick={() => openInlineWizard({ wizardType: APPROVAL_WIZARD_TYPE, marketId, investibleId,
                groupId })}
              icon={<AddIcon fontSize="small" />}
              translationId="createNewApproval"
            />}
        </h2>
        <IconButton id="approvalsToggleId" onClick={() => toggleApprovals()} style={{
          marginBottom: 0,
          paddingBottom: 0, marginTop: 0, paddingTop: '5px'
        }}>
          <Tooltip key="toggleApprovals"
                   title={<FormattedMessage
                     id={`${approvalsDisplayOpen ? 'closeApprovals' : 'openApprovals'}Tip`}/>}>
            {approvalsDisplayOpen ? <ExpandLess fontSize="small" /> :
              <ExpandMoreIcon fontSize="small" />}
          </Tooltip>
        </IconButton>
      </div>
      {(_.isEmpty(search) || displayApprovalsBySearch > 0) && approvalsDisplayOpen && (
        <Voting
          investibleId={investibleId}
          marketPresences={marketPresences}
          investmentReasons={investmentReasons}
          showExpiration={showExpiration}
          expirationMinutes={market.investment_expiration * 1440}
          yourPresence={yourPresence}
          showEmptyText
          market={market}
          groupId={groupId}
          isAssigned={isAssigned}
        />
      )}
    </>
  );
}

Approvals.propTypes = {
  displayVotingInput: PropTypes.bool.isRequired,
  groupId: PropTypes.string,
  hash: PropTypes.string,
  hidden: PropTypes.bool,
  investmentReasons: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired,
  isAssigned: PropTypes.bool.isRequired,
  isInVoting: PropTypes.bool.isRequired,
  market: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  openInlineWizard: PropTypes.func.isRequired,
  search: PropTypes.string,
  showExpiration: PropTypes.bool,
  visible: PropTypes.bool.isRequired,
  yourPresence: PropTypes.object
};

export default Approvals;
