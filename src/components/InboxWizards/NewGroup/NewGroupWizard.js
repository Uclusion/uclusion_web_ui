import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import IntroduceGroupStep from './IntroduceGroupStep';
import IntroduceWorkspaceStep from './IntroduceWorkspaceStep';

function NewGroupWizard(props) {
  const { message } = props;
  const { type_object_id: parentElementId, group_id: groupId, market_id: marketId } = message;
  return (
    <FormdataWizard name={`new_group_wizard${parentElementId}`} defaultFormData={{parentElementId}}>
      {groupId === marketId && (
        <IntroduceWorkspaceStep message={message} />
      )}
      {groupId !== marketId && (
        <IntroduceGroupStep message={message}/>
      )}
    </FormdataWizard>
  );
}

NewGroupWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

NewGroupWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default NewGroupWizard;

