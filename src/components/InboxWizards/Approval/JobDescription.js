import _ from 'lodash'
import { Typography } from '@material-ui/core'
import DescriptionOrDiff from '../../Descriptions/DescriptionOrDiff'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import React, { useContext } from 'react'
import { useInvestibleEditStyles } from '../../../pages/Investible/InvestibleBodyEdit'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { JUSTIFY_TYPE } from '../../../constants/comments'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { WizardStylesContext } from '../WizardStylesContext'

function JobDescription(props) {
  const { investibleId, marketId } = props;
  const investibleEditClasses = useInvestibleEditStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentState] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const classes = useContext(WizardStylesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible: myInvestible } = inv || {};
  const { name, description } = myInvestible || {};
  const investibleComments = getInvestibleComments(investibleId, marketId, commentState);
  const investmentReasonsRemoved = investibleComments.filter(comment => !comment.resolved &&
    comment.comment_type !== JUSTIFY_TYPE) || [];
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};

  return (
    <>
      <div style={{maxHeight: '300px', minHeight: '200px', overflowY: 'auto', overflowX: 'hidden', paddingLeft: '4px',
        paddingRight: '4px', paddingTop: '1rem', display: 'flex'}}>
        <div style={{width: !_.isEmpty(investmentReasonsRemoved) ? '50%' : undefined}}>
          <Typography className={investibleEditClasses.title} variant="h3" component="h1">
            {name}
          </Typography>
          <DescriptionOrDiff id={investibleId} description={description} showDiff={false} />
        </div>
        {!_.isEmpty(investmentReasonsRemoved) && (
          <div style={{paddingLeft: '1rem'}}>
            <CommentBox
              comments={investmentReasonsRemoved}
              marketId={marketId}
              allowedTypes={[]}
              fullStage={fullStage}
              investible={inv}
              marketInfo={marketInfo}
              isInbox
              removeActions
            />
          </div>
        )}
      </div>
      <div className={classes.borderBottom} />
    </>
  )
}

export default JobDescription;