import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import BugDescriptionStep from './BugDescriptionStep';

function BugWizard(props) {
  const { marketId, groupId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="bug_wizard">
        <BugDescriptionStep marketId={marketId} groupId={groupId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

BugWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
  groupId: PropTypes.string.isRequired,
};
export default BugWizard;

