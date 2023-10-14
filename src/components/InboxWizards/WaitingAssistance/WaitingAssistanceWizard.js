import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideAssistanceStep from './DecideAssistanceStep';

function WaitingAssistanceWizard(props) {
  const { marketId, commentId, rowId } = props;

  return (
    <FormdataWizard name={`waiting_wizard${commentId}`}
                    defaultFormData={{parentElementId: rowId, useCompression: true}}>
      <DecideAssistanceStep marketId={marketId} commentId={commentId} />
    </FormdataWizard>
  );
}

WaitingAssistanceWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

WaitingAssistanceWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default WaitingAssistanceWizard;

