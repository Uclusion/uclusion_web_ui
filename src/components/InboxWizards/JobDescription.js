import { Typography } from '@material-ui/core'
import DescriptionOrDiff from '../Descriptions/DescriptionOrDiff'
import React, { useContext } from 'react'
import { useInvestibleEditStyles } from '../../pages/Investible/InvestibleBodyEdit'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { WizardStylesContext } from './WizardStylesContext'
import GravatarGroup from '../Avatars/GravatarGroup'
import { getMarketInfo } from '../../utils/userFunctions'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import { editorEmpty } from '../TextEditors/Utilities/CoreUtils'

function JobDescription(props) {
  const { investibleId, marketId } = props;
  const intl = useIntl();
  const investibleEditClasses = useInvestibleEditStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned } = marketInfo || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const assignedPresences = marketPresences.filter((presence) => (assigned || []).includes(presence.id))
  const { investible: myInvestible } = inv || {};
  const { name, description } = myInvestible || {};
  const editorIsEmpty = editorEmpty(description);

  return (
    <>
      <div style={{maxHeight: '300px', minHeight: editorIsEmpty ? undefined : '200px', overflowY: 'auto',
        overflowX: 'hidden', paddingLeft: '4px', paddingRight: '4px', paddingTop: '1rem'}}>
        {!_.isEmpty(assignedPresences) && (
          <div style={{alignItems: 'center', display: 'flex', paddingBottom: '1rem'}}>
            <Typography variant='body2' style={{ paddingRight: '0.5rem'}}>
              {intl.formatMessage({ id: 'planningInvestibleAssignments' })}</Typography>
            <GravatarGroup users={assignedPresences} gravatarClassName={classes.smallGravatar} />
          </div>
        )}
        <Typography className={investibleEditClasses.title} variant="h3" component="h1">
          {name}
        </Typography>
        {!editorIsEmpty && (
          <DescriptionOrDiff id={investibleId} description={description} showDiff={false} />
        )}
      </div>
      <div className={classes.borderBottom} />
    </>
  )
}

export default JobDescription;