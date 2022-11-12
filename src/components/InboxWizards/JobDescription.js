import { Typography } from '@material-ui/core'
import DescriptionOrDiff from '../Descriptions/DescriptionOrDiff'
import React, { useContext } from 'react'
import { useInvestibleEditStyles } from '../../pages/Investible/InvestibleBodyEdit'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { WizardStylesContext } from './WizardStylesContext'

function JobDescription(props) {
  const { investibleId } = props;
  const investibleEditClasses = useInvestibleEditStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible: myInvestible } = inv || {};
  const { name, description } = myInvestible || {};

  return (
    <>
      <div style={{maxHeight: '300px', minHeight: '200px', overflowY: 'auto', overflowX: 'hidden', paddingLeft: '4px',
        paddingRight: '4px', paddingTop: '1rem'}}>
        <Typography className={investibleEditClasses.title} variant="h3" component="h1">
          {name}
        </Typography>
        <DescriptionOrDiff id={investibleId} description={description} showDiff={false} />
      </div>
      <div className={classes.borderBottom} />
    </>
  )
}

export default JobDescription;