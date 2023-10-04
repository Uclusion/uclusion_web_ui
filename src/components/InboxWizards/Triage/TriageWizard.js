import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import TriageStep from './TriageStep';

function TriageWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`triage_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <TriageStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

TriageWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

TriageWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default TriageWizard;

