import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideAssignStep from './DecideAssignStep';

function AssignToOtherWizard(props) {
  const { marketId, investibleId, rowId, typeObjectId } = props;

  return (
    <FormdataWizard name={`assign_other_wizard${investibleId}`} defaultFormData={{parentElementId: rowId}}>
      <DecideAssignStep marketId={marketId} investibleId={investibleId} typeObjectId={typeObjectId} />
    </FormdataWizard>
  );
}

AssignToOtherWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AssignToOtherWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default AssignToOtherWizard;

