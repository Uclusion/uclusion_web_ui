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
import { Assignments, usePlanningInvestibleStyles } from '../../pages/Investible/Planning/PlanningInvestible';
import { FormattedMessage } from 'react-intl';
import { getCurrentStageLabelId, getStagesInfo } from '../../utils/stageUtils';
import CondensedTodos from '../../pages/Investible/Planning/CondensedTodos';
import { TODO_TYPE } from '../../constants/comments';

function JobDescription(props) {
  const { investibleId, marketId, comments, showDescription=true, showAssigned=true, inboxMessageId,
    removeActions, showVoting, selectedInvestibleIdParent, setSelectedInvestibleIdParent, preserveOrder,
    showStage } = props;
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
  const { assigned, stage } = marketInfo || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const assignedPresences = marketPresences.filter((presence) => (assigned || []).includes(presence.id))
  const { investible: myInvestible } = inv || {};
  const { name, description } = myInvestible || {};
  const editorIsEmpty = editorEmpty(description);
  const stagesInfo = getStagesInfo(marketId, marketStagesState, stage);
  const stageLabelId = getCurrentStageLabelId(stagesInfo);
  const todoComments = comments?.filter((comment) => comment.comment_type === TODO_TYPE);
  const nonTodoComments = comments?.filter((comment) => comment.comment_type !== TODO_TYPE);

  return (
    <>
      <div style={{paddingLeft: '4px', paddingRight: '4px' }}>
        {!_.isEmpty(assignedPresences) && showAssigned && (
          <div className={planningClasses.assignments} style={{paddingBottom: '1.5rem', display: 'flex'}}>
            <div className={planningClasses.assignmentContainer}>
              <Assignments
                classes={planningClasses}
                marketPresences={marketPresences}
                assigned={assigned}
                assignmentColumnMessageId='planningInvestibleAssignments'
                toolTipId='storyAddParticipantsLabel'
                isLarge
              />
            </div>
            {showStage && (
              <div style={{marginLeft: '2rem'}}>
                <FormattedMessage id='allowedStagesDropdownLabel' />
                <div style={{marginTop: '0.5rem'}}>
                  <b><FormattedMessage id={stageLabelId} /></b>
                </div>
              </div>
            )}
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
        {!_.isEmpty(todoComments) && (
          <CondensedTodos comments={todoComments} investibleComments={comments} isInbox marketId={marketId}
                          marketInfo={marketInfo} />
        )}
        {!_.isEmpty(nonTodoComments) && (
          <div style={{paddingTop: '1rem', paddingBottom: '0.5rem', paddingLeft: '0.25rem',
            paddingRight: mobileLayout ? '0.5rem' : '10rem', overflowY: 'hidden', overflowX: 'hidden' }}>
            <CommentBox
              comments={nonTodoComments}
              preserveOrder={preserveOrder}
              marketId={marketId}
              allowedTypes={[]}
              fullStage={getFullStage(marketStagesState, marketId, marketInfo.stage) || {}}
              investible={inv}
              marketInfo={marketInfo}
              isInbox
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