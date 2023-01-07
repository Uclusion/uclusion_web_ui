import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAnswerStep from './DecideAnswerStep'

function AnswerWizard(props) {
  const { marketId, commentId, message } = props;

  return (
    <FormdataWizard name={`answer_wizard${commentId}`}
                    defaultFormData={{parentElementId: `workListItem${message.type_object_id}`}}>
      <DecideAnswerStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

AnswerWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AnswerWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default AnswerWizard;

