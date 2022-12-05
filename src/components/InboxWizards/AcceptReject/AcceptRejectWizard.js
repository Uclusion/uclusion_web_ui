import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAcceptRejectStep from './DecideAcceptRejectStep'

function AcceptRejectWizard(props) {
  const { marketId, commentId, message } = props;

  return (
    <FormdataWizard name={`accept_wizard${commentId}`}>
      <DecideAcceptRejectStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

AcceptRejectWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AcceptRejectWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default AcceptRejectWizard;

