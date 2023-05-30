import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecidePromoteStep from './DecidePromoteStep';

function OptionSubmittedWizard(props) {
  const { marketId, commentId, investibleId, commentMarketId, message } = props;
  const  parentElementId = message.type_object_id;
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

OptionSubmittedWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default OptionSubmittedWizard;

