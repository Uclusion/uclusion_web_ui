import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideUnblockStep from './DecideUnblockStep';
import ReplyStep from '../ReplyStep';

function BlockedWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`unblock_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <DecideUnblockStep marketId={marketId} commentId={commentId} message={message}/>
      <ReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

BlockedWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

BlockedWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default BlockedWizard;

