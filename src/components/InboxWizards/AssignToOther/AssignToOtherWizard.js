import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAssignStep from './DecideAssignStep'

function AssignToOtherWizard(props) {
  const { marketId, investibleId, rowId } = props;

  return (
    <FormdataWizard name={`assign_other_wizard${investibleId}`} defaultFormData={{parentElementId: rowId}}>
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

