import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideReviewStep from './DecideReviewStep'
import ActionReviewStep from './ActionReviewStep'

function ReviewWizard(props) {
  const { marketId, investibleId, message } = props;

  return (
    <FormdataWizard name={`review_wizard${investibleId}`}>
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

