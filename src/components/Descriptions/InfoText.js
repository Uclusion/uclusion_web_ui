import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl'
import InfoIcon from '@material-ui/icons/Info';
import { useMetaDataStyles } from '../../pages/Investible/Planning/PlanningInvestible';
import { Tooltip } from '@material-ui/core';

function InfoText(props) {
  const {
    textId,
    children
  } = props;
  const intl = useIntl();
  const metaClasses = useMetaDataStyles();

  return (
    <dl className={metaClasses.root}>
      <Tooltip title={intl.formatMessage({ id: textId })}>
        <InfoIcon color='primary' className={metaClasses.expirationProgress} />
      </Tooltip>
      {children}
    </dl>
  );
}

InfoText.propTypes = {
  textId: PropTypes.string.isRequired,
  children: PropTypes.any.isRequired,
};

export default InfoText;
