import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAssistanceStep from './DecideAssistanceStep'

function WaitingAssistanceWizard(props) {
  const { marketId, commentId, rowId } = props;

  return (
    <FormdataWizard name={`waiting_wizard${commentId}`} defaultFormData={{parentElementId: rowId}}>
      <DecideAssistanceStep marketId={marketId} commentId={commentId} />
    </FormdataWizard>
  );
}

WaitingAssistanceWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

WaitingAssistanceWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default WaitingAssistanceWizard;

