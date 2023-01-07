import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideResolveStep from './DecideResolveStep'

function ResolveWizard(props) {
  const { marketId, commentId, message } = props;

  return (
    <FormdataWizard name={`resolve_wizard${commentId}`}
                    defaultFormData={{parentElementId: `workListItem${message.type_object_id}`}}>
      <DecideResolveStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

ResolveWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ResolveWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default ResolveWizard;

