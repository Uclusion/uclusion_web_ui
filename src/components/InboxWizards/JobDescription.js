import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import DescriptionOrDiff from '../Descriptions/DescriptionOrDiff';
import React, { useContext } from 'react';
import { useInvestibleEditStyles } from '../../pages/Investible/InvestibleBodyEdit';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { wizardStyles } from './WizardStylesContext';
import { getMarketInfo } from '../../utils/userFunctions';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import _ from 'lodash';
import { editorEmpty } from '../TextEditors/Utilities/CoreUtils';
import CommentBox from '../../containers/CommentBox/CommentBox';
import { getFullStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { usePlanningInvestibleStyles } from '../../pages/Investible/Planning/PlanningInvestible';
import { FormattedMessage } from 'react-intl';
import CondensedTodos from '../../pages/Investible/Planning/CondensedTodos';
import { REPLY_TYPE, TODO_TYPE } from '../../constants/comments';
import GravatarGroup from '../Avatars/GravatarGroup';

function JobDescription(props) {
  const { investibleId, marketId, comments, showDescription=true, showAssigned=true, inboxMessageId,
    removeActions, showVoting, selectedInvestibleIdParent, setSelectedInvestibleIdParent, preserveOrder,
    removeCompression, useCompression, isSingleTaskDisplay = false } = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const investibleEditClasses = useInvestibleEditStyles();
  const planningClasses = usePlanningInvestibleStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const classes = wizardStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned } = marketInfo || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const assignedPresences = marketPresences.filter((presence) => (assigned || []).includes(presence.id))
  const { investible: myInvestible } = inv || {};
  const { name, description } = myInvestible || {};
  const editorIsEmpty = editorEmpty(description);
  const todoComments = comments?.filter((comment) => comment.comment_type === TODO_TYPE);
  const nonTodoComments = comments?.filter((comment) => comment.comment_type !== TODO_TYPE);
  const nonTodoCommentsRoots = nonTodoComments?.filter((comment) => comment.comment_type !== REPLY_TYPE);

  return (
    <>
      <div style={{paddingLeft: '4px', paddingRight: '4px' }}>
        {!_.isEmpty(assignedPresences) && showAssigned && (
          <div className={planningClasses.assignments}
               style={{paddingBottom: '1.5rem', display: 'flex', alignItems: 'center'}}>
            <b style={{marginRight: '1rem'}}><FormattedMessage id="planningInvestibleAssignments" /></b>
            <GravatarGroup users={assignedPresences} gravatarClassName={classes.smallGravatar} />
          </div>
        )}
        <Typography className={investibleEditClasses.title} variant="h3" component="h1"
                    style={{cursor: 'pointer', color: 'blue', textDecoration: 'underline'}}
                    onClick={() => navigate(history, formInvestibleLink(marketId, investibleId))}>
          {name}
        </Typography>
        {!editorIsEmpty && showDescription && (
          <DescriptionOrDiff id={investibleId} description={description} showDiff={false} />
        )}
        {!_.isEmpty(todoComments) && !isSingleTaskDisplay && (
          <CondensedTodos comments={todoComments} investibleComments={comments} isInbox marketId={marketId}
                          marketInfo={marketInfo} />
        )}
        {(!_.isEmpty(nonTodoCommentsRoots) || isSingleTaskDisplay) && (
          <div style={{paddingTop: '1rem', paddingBottom: '0.5rem', paddingLeft: '0.25rem',
            paddingRight: mobileLayout ? '0.5rem' : '10rem', overflowY: 'hidden', overflowX: 'hidden' }}>
            <CommentBox
              comments={isSingleTaskDisplay ? comments : nonTodoComments}
              preserveOrder={preserveOrder}
              marketId={marketId}
              allowedTypes={[]}
              fullStage={getFullStage(marketStagesState, marketId, marketInfo.stage) || {}}
              investible={inv}
              marketInfo={marketInfo}
              isInbox
              removeCompression={removeCompression}
              useCompression={useCompression}
              inboxMessageId={inboxMessageId}
              removeActions={removeActions}
              showVoting={showVoting}
              selectedInvestibleIdParent={selectedInvestibleIdParent}
              setSelectedInvestibleIdParent={setSelectedInvestibleIdParent}
            />
          </div>
        )}
      </div>
      <div className={classes.borderBottom} />
    </>
  )
}

export default JobDescription;