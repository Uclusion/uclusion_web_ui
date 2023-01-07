import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideStageStep from './DecideStageStep'

function StageWizard(props) {
  const { marketId, investibleId, rowId } = props;

  return (
    <FormdataWizard name={`stage_wizard${investibleId}`} defaultFormData={{parentElementId: rowId}}>
      <DecideStageStep marketId={marketId} investibleId={investibleId} />
    </FormdataWizard>
  );
}

StageWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StageWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default StageWizard;

