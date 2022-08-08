import NameField from '../../../components/TextFields/NameField'
import React from 'react'
import { Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'

function MarketCreate() {
  const intl = useIntl();
  return (
    <div style={{paddingBottom: '0.5rem'}}>
      <Typography variant="h6" align="left">
        {intl.formatMessage({ id: 'marketName' })}
      </Typography>
      <NameField editorName="newMarket" label="agilePlanFormTitleLabel" placeHolder="decisionTitlePlaceholder"
               id="newMarket" />
    </div>
  )
}

export default MarketCreate;