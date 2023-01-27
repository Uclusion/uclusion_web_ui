import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideResolveStep from './DecideResolveStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function ResolveWizard(props) {
  const { marketId, commentId, message, inboxDispatch } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`resolve_wizard${commentId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
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

