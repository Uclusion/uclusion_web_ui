import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ChooseTypeStep from './ChooseTypeStep';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import _ from 'lodash';
import ChooseGroupStep from './ChooseGroupStep';

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
          <ChooseGroupStep groups={groups} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

ComposeWizard.propTypes = {
  marketId: PropTypes.string.isRequired
};
export default ComposeWizard;

