import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecidePromoteStep from './DecidePromoteStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function OptionSubmittedWizard(props) {
  const { marketId, commentId, investibleId, commentMarketId, message, inboxDispatch } = props;
  const  parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`submission_wizard${commentId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <DecidePromoteStep marketId={marketId} commentId={commentId} investibleId={investibleId}
                         commentMarketId={commentMarketId} message={message}/>
    </FormdataWizard>
  );
}

OptionSubmittedWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

OptionSubmittedWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default OptionSubmittedWizard;

