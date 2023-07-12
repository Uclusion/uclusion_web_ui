import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import IntroduceGroupStep from './IntroduceGroupStep';

function NewGroupWizard(props) {
  const { message } = props;
  const  parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`new_group_wizard${parentElementId}`} defaultFormData={{parentElementId}}>
      <IntroduceGroupStep message={message}/>
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

