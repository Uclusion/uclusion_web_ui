import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideFeedbackStep from './DecideFeedbackStep';

function FeedbackWizard(props) {
  const { marketId, investibleId, message } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`feedback_wizard${investibleId}`} defaultFormData={{parentElementId}}>
      <DecideFeedbackStep marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

FeedbackWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

FeedbackWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default FeedbackWizard;

