import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAssignStep from './DecideAssignStep'

function AssignWizard(props) {
  const { marketId, investibleId, message } = props;

  return (
    <FormdataWizard name={`assign_wizard${investibleId}`}
                    defaultFormData={{parentElementId: `workListItem${message.type_object_id}`}}>
      <DecideAssignStep marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

AssignWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AssignWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default AssignWizard;

