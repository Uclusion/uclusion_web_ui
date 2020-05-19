/** This step launches a wizard within some outer wizard,
 and keeps track of any state. An example of that is the
 add option wizard inside the DialogWizard
 */
import React from 'react';
import PropTypes from 'prop-types';


function SubWizardStep(props) {
  const {
    outsideSubWizardContent,
    showSubWizard,
    onFinish,
    onStartOver,
    onCancel,
    subWizard } = props;
}


SubWizardStep.propTypes = {

}
