import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ChooseTypeStep from './ChooseTypeStep';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import _ from 'lodash';
import ChooseGroupStep from './ChooseGroupStep';
import { formMarketAddCommentLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { BUG_WIZARD_TYPE, DISCUSSION_WIZARD_TYPE, JOB_WIZARD_TYPE } from '../../../constants/markets';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';

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
    default:
      navigate(history, formMarketAddCommentLink(BUG_WIZARD_TYPE, marketId, groupId, 0));
      break;
  }
}
function ComposeWizard(props) {
  const { marketId } = props;
  const [groupsState] = useContext(MarketGroupsContext);
  const groups = groupsState[marketId];
  const groupId = _.size(groups) === 1 ? marketId : undefined;

  if (_.isEmpty(groups)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`compose_wizard${marketId}`}>
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

