import React from 'react';
import { wizardStyles } from './WizardStylesContext';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip, useMediaQuery, useTheme } from '@material-ui/core';
import { POKED } from '../../constants/notifications';
import _ from 'lodash';

function WizardStepContainer (props) {
  const { children, startOver, message } = props;
  const intl = useIntl();
  const classes = wizardStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { alert_type: alertType, poked_list: pokedList } = message || {}
  const poked = alertType === POKED || !_.isEmpty(pokedList);

  return (
    <>
      <div onClick={startOver} style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9,
        position: 'sticky',
        marginTop: '-28px',
        marginBottom: '25px',
        paddingRight: '8rem',
        color: 'rgba(0, 0, 0, 0.62)',
        width: '20rem',
        marginLeft: 'auto', marginRight: 'auto',
      }}>
        {intl.formatMessage({ id: 'JobWizardStartOver' })}
      </div>
      {poked && (
        <Tooltip key='pokedKey'
                 title={<FormattedMessage id='pokedExplanation' />}>
          <div style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9,
            border: '2px solid #2D9CDB',
            paddingTop: '3px',
            position: 'sticky',
            marginTop: mobileLayout ? '-10px' : '-41px',
            marginBottom: '25px',
            marginLeft: '10rem',
            color: 'red',
            width: '5rem',
          }}>
            <b>{intl.formatMessage({ id: 'poked' })}</b>
          </div>
        </Tooltip>
      )}
      <div className={classes.baseCard} style={{ overflowX: 'hidden' }}>
        {children}
      </div>
    </>
  )
    ;
}

export default WizardStepContainer;