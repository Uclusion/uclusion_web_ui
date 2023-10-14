import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideResponseStep from './DecideResponseStep';
import ReplyStep from '../ReplyStep';

function ReplyResolveWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`reply_resolve_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideResponseStep marketId={marketId} commentId={commentId} message={message}/>
      <ReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

ReplyResolveWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ReplyResolveWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default ReplyResolveWizard;

