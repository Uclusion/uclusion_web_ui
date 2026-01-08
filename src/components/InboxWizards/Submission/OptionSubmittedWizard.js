import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecidePromoteStep from './DecidePromoteStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function OptionSubmittedWizard(props) {
  const { marketId, commentId, investibleId, commentMarketId, message } = props;
  const  parentElementId = getMessageId(message);
  return (
    <FormdataWizard name={`submission_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <DecidePromoteStep marketId={marketId} commentId={commentId} investibleId={investibleId}
                         commentMarketId={commentMarketId} message={message}/>
    </FormdataWizard>
  );
}

OptionSubmittedWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default OptionSubmittedWizard;

