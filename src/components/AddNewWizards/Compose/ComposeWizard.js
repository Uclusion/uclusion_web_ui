import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ChooseTypeStep from './ChooseTypeStep';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import _ from 'lodash';
import ChooseGroupStep from './ChooseGroupStep';
import { formMarketAddCommentLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { BUG_WIZARD_TYPE, DISCUSSION_WIZARD_TYPE, JOB_WIZARD_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { getGroupPresences, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';

export function goToChosenWizard(useType, marketId, groupId, history) {
  switch(useType) {
    case 'JOB':
      navigate(history, formWizardLink(JOB_WIZARD_TYPE, marketId, undefined, groupId));
      break;
    case QUESTION_TYPE:
      navigate(history, formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, QUESTION_TYPE));
      break;
    case SUGGEST_CHANGE_TYPE:
      navigate(history, formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, SUGGEST_CHANGE_TYPE));
      break;
    case TODO_TYPE:
      navigate(history, formMarketAddCommentLink(BUG_WIZARD_TYPE, marketId, groupId, 0));
      break;
    default:
      navigate(history, `/wizard#type=${PLANNING_TYPE.toLowerCase()}&marketId=${marketId}`)
      break;
  }
}
function ComposeWizard(props) {
  const { marketId } = props;
  const [groupsState] = useContext(MarketGroupsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const groupsRaw = groupsState[marketId] || [];
  const groups = groupsRaw.filter((group) => {
    const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId,
      group.id) || [];
    return !_.isEmpty(groupPresences);
  });
  const groupId = _.size(groups) === 1 ? marketId : undefined;

  if (_.isEmpty(groups)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`compose_wizard${marketId}`} useLocalStorage={false}>
        <ChooseTypeStep marketId={marketId} groupId={groupId} />
        {_.isEmpty(groupId) && (
          <ChooseGroupStep marketId={marketId} groups={groups} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

ComposeWizard.propTypes = {
  marketId: PropTypes.string.isRequired
};
export default ComposeWizard;

