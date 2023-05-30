import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideAssignStep from './DecideAssignStep';

function AssignWizard(props) {
  const { marketId, investibleId, message } = props;
  const parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`assign_wizard${investibleId}`} defaultFormData={{parentElementId}}>
      <DecideAssignStep marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

AssignWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AssignWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default AssignWizard;

