import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideAnswerStep from './DecideAnswerStep';

function AnswerWizard(props) {
  const { marketId, commentId, message } = props;
  const  parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`answer_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideAnswerStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

AnswerWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AnswerWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default AnswerWizard;

