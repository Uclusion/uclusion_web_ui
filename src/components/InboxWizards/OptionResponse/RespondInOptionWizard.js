import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideResponseStep from './DecideResponseStep';
import ReplyStep from '../ReplyStep';

function RespondInOptionWizard(props) {
  const { marketId, commentId, message } = props;
  const  parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`option_response_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <DecideResponseStep marketId={marketId} commentId={commentId} message={message}/>
      <ReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

RespondInOptionWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

RespondInOptionWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default RespondInOptionWizard;

