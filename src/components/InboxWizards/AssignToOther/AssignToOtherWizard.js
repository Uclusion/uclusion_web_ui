import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAssignStep from './DecideAssignStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function AssignToOtherWizard(props) {
  const { marketId, investibleId, rowId, inboxDispatch } = props;

  return (
    <FormdataWizard name={`assign_other_wizard${investibleId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(rowId))}
                    defaultFormData={{parentElementId: rowId}}>
      <DecideAssignStep marketId={marketId} investibleId={investibleId} />
    </FormdataWizard>
  );
}

AssignToOtherWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AssignToOtherWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default AssignToOtherWizard;

