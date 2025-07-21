import { Link, useMediaQuery, useTheme } from '@material-ui/core';
import DescriptionOrDiff from '../Descriptions/DescriptionOrDiff';
import React, { useContext } from 'react';
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
import { formInvestibleLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { usePlanningInvestibleStyles } from '../../pages/Investible/Planning/PlanningInvestible';
import { FormattedMessage } from 'react-intl';
import CondensedTodos from '../../pages/Investible/Planning/CondensedTodos';
import { REPLY_TYPE, TODO_TYPE } from '../../constants/comments';
import GravatarGroup from '../Avatars/GravatarGroup';
import { attachedFilesStyles, displayLinksList } from '../Files/AttachedFilesList';
import config from '../../config';
import CompressedDescription from './CompressedDescription';
import { isLargeDisplay } from '../../utils/stringFunctions';

function JobDescription(props) {
  const { investibleId, marketId, comments, showAssigned=true, inboxMessageId, showRequiredApprovers = false,
    removeActions, showVoting, selectedInvestibleIdParent, preserveOrder, showAttachments, toggleCompression,
    useCompression, isSingleTaskDisplay = false, showCreatedBy = false, commentMarketId, expandTasksNotSection=false,
    showDiff = false, tasksDefaultOpen=false, hideTabs=false } = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const planningClasses = usePlanningInvestibleStyles();
  const attachedStyles = attachedFilesStyles();
  const fileBaseUrl = config.file_download_configuration.baseURL;
  const [investiblesState] = useContext(InvestiblesContext);
  const classes = wizardStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned, required_approvers:  requiredApproversIds, created_by: createdById } = marketInfo || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const createdBy = marketPresences.find((presence) => presence.id === createdById) || {};
  const assignedPresences = marketPresences.filter((presence) => (assigned || []).includes(presence.id));
  const requiredApprovers = marketPresences.filter((presence) => (requiredApproversIds || [])
    .includes(presence.id));
  const { investible: myInvestible } = inv || {};
  const { name, description, attached_files: attachedFiles } = myInvestible || {};
  const editorIsEmpty = editorEmpty(description);
  const todoComments = comments?.filter((comment) => comment.comment_type === TODO_TYPE);
  const nonTodoComments = comments?.filter((comment) => comment.comment_type !== TODO_TYPE);
  const nonTodoCommentsRoots = nonTodoComments?.filter((comment) => comment.comment_type !== REPLY_TYPE);
  const normalDescriptionDisplay = showDiff || !isLargeDisplay(description);
  const fullDescription = <DescriptionOrDiff id={investibleId} description={description} showDiff={showDiff} />;
  const planningMarketId = commentMarketId || marketId;

  return (
    <>
      <div style={{ paddingLeft: '4px', marginRight: '10%' }}>
        {investibleId && (
          <div
            style={{ display: mobileLayout ? undefined : 'flex', paddingBottom: mobileLayout ? '1.5rem' : undefined }}>
            <Link href={formInvestibleLink(planningMarketId, investibleId)} variant="h6"
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    navigate(history, formInvestibleLink(planningMarketId, investibleId));
                  }}>
              {name}
            </Link>
            {!_.isEmpty(createdBy) && showCreatedBy && (
              <div className={planningClasses.assignments}
                   style={{ paddingLeft: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <b style={{ marginRight: '0.5rem' }}><FormattedMessage id="created_by"/></b>
                <GravatarGroup users={[createdBy]} gravatarClassName={classes.smallGravatar}/>
              </div>
            )}
            {!_.isEmpty(assignedPresences) && showAssigned && (
              <div className={planningClasses.assignments}
                   style={{ paddingLeft: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <b style={{ marginRight: '0.5rem' }}><FormattedMessage id="planningInvestibleAssignments"/></b>
                <GravatarGroup users={assignedPresences} gravatarClassName={classes.smallGravatar}/>
              </div>
            )}
            {!_.isEmpty(requiredApprovers) && showRequiredApprovers && (
              <div className={planningClasses.assignments}
                   style={{ paddingLeft: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <b style={{ marginRight: '0.5rem' }}><FormattedMessage id="requiredApprovers"/></b>
                <GravatarGroup users={requiredApprovers} gravatarClassName={classes.smallGravatar}/>
              </div>
            )}
          </div>
        )}
        {!editorIsEmpty && (
          !normalDescriptionDisplay ?
            <CompressedDescription description={description} expansionPanel={fullDescription}/> : fullDescription
        )}
        {showAttachments && (
          <div style={{marginTop: '2rem'}}>
            <div className={attachedStyles.sectionTitle}>
              <FormattedMessage id="attachededFilesSection"/>
            </div>
            <div>
              {displayLinksList(attachedFiles, fileBaseUrl, marketId, undefined, attachedStyles)}
            </div>
          </div>
        )}
        {(!_.isEmpty(nonTodoCommentsRoots) || isSingleTaskDisplay) && (
          <div style={{
            paddingBottom: '0.5rem',
            marginTop: '1.5rem',
            overflowY: 'hidden',
            overflowX: 'hidden',
            paddingRight: '0.5rem'
          }}>
            <CommentBox
              comments={isSingleTaskDisplay ? comments : nonTodoComments}
              preserveOrder={preserveOrder}
              marketId={planningMarketId}
              allowedTypes={[]}
              fullStage={getFullStage(marketStagesState, marketId, marketInfo.stage) || {}}
              investible={inv}
              marketInfo={marketInfo}
              isInbox
              compressAll
              usePadding={false}
              toggleCompression={toggleCompression}
              useCompression={useCompression}
              inboxMessageId={inboxMessageId}
              removeActions={removeActions}
              showVoting={showVoting}
              selectedInvestibleIdParent={selectedInvestibleIdParent}
            />
          </div>
        )}
        {!_.isEmpty(todoComments) && !isSingleTaskDisplay && (
          <CondensedTodos comments={todoComments} investibleComments={comments} isInbox marketId={marketId} expandTasksNotSection={expandTasksNotSection}
                          marketInfo={marketInfo} usePadding={false} isDefaultOpen={tasksDefaultOpen} hideTabs={hideTabs}
                          removeActions={removeActions} />
        )}
      </div>
    </>
  )
}

export default JobDescription;