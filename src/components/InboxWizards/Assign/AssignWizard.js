import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAssignStep from './DecideAssignStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function AssignWizard(props) {
  const { marketId, investibleId, message, inboxDispatch } = props;
  const parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`assign_wizard${investibleId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
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

