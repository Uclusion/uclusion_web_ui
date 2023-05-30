import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideReviewStep from './DecideReviewStep';

function ReviewWizard(props) {
  const { marketId, investibleId, message } = props;
  const parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`review_wizard${investibleId}`} defaultFormData={{parentElementId}}>
      <DecideReviewStep marketId={marketId} investibleId={investibleId} message={message} />
    </FormdataWizard>
  );
}

ReviewWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ReviewWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default ReviewWizard;

