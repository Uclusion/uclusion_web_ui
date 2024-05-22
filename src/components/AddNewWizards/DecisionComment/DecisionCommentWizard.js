import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AddCommentStep from './AddCommentStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';

function DecisionCommentWizard(props) {
  const { investibleId, commentType } = props;
  const [investibleState] = useContext(InvestiblesContext);
  const inv = getInvestible(investibleState, investibleId);
  // Only one market possible for decision investible
  const marketInfo = inv?.market_infos[0];
  const { market_id: marketId, group_id: groupId } = marketInfo || {};

  if (!groupId) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`decision_comment_wizard${investibleId}`}>
        <AddCommentStep investibleId={investibleId} marketId={marketId} groupId={groupId} commentType={commentType} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

DecisionCommentWizard.propTypes = {
  investibleId: PropTypes.string.isRequired
};
export default DecisionCommentWizard;

