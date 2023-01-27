import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideReviewStep from './DecideReviewStep'
import ActionReviewStep from './ActionReviewStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function ReviewWizard(props) {
  const { marketId, investibleId, message, inboxDispatch } = props;
  const parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`review_wizard${investibleId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <DecideReviewStep marketId={marketId} investibleId={investibleId} message={message} />
      <ActionReviewStep marketId={marketId} investibleId={investibleId} message={message} />
    </FormdataWizard>
  );
}

ReviewWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ReviewWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default ReviewWizard;

