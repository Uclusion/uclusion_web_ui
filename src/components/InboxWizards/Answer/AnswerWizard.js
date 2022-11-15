import React from 'react'
import PropTypes from 'prop-types'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DecideAnswerStep from './DecideAnswerStep'

function AnswerWizard(props) {
  const { marketId, commentId, message } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`answer_wizard${commentId}`}>
        <DecideAnswerStep marketId={marketId} commentId={commentId} message={message}/>
      </FormdataWizard>
    </WizardStylesProvider>
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

