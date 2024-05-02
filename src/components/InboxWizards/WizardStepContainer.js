import React from 'react';
import { wizardStyles } from './WizardStylesContext';
import { FormattedMessage, useIntl } from 'react-intl';
import { Tooltip, useMediaQuery, useTheme } from '@material-ui/core';
import { POKED } from '../../constants/notifications';
import _ from 'lodash';
import styled from 'styled-components';

const StartOverText = styled("div")`
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9;
    position: sticky;
    margin-top: -27px;
    margin-bottom: 25px;
    margin-left: auto;
    margin-right: auto;
    padding-right: 8rem;
    color: rgba(0, 0, 0, 0.62);
    width: 20rem;
    &:hover {
        color: darkgrey;
    }
`;

function WizardStepContainer (props) {
  const { children, startOver, message, currentStep } = props;
  const intl = useIntl();
  const classes = wizardStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { alert_type: alertType, poked_list: pokedList } = message || {}
  const poked = alertType === POKED || !_.isEmpty(pokedList);

  return (
    <>
      {currentStep > 0 && (
        <StartOverText onClick={startOver}>
          {intl.formatMessage({ id: 'JobWizardStartOver' })}
        </StartOverText>
      )}
      {poked && (
        <Tooltip key="pokedKey"
                 title={<FormattedMessage id="pokedExplanation"/>}>
          <div style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9,
            border: '2px solid #2D9CDB',
            paddingTop: '3px',
            position: 'sticky',
            marginTop: mobileLayout ? '-4px' : '-30px',
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