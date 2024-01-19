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
import { attachedFilesStyles, displayLinksList } from '../Files/AttachedFilesList';
import config from '../../config';
import CompressedDescription from './CompressedDescription';
import { stripHTML } from '../../utils/stringFunctions';

function isLargeDisplay(description) {
  const forbiddenList = ['img', 'br', 'table', 'tr', 'td', 'tbody', 'th', 'li', 'ol', 'ul'];
  const singleRootedList = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  let txt = new DOMParser().parseFromString(description, "text/html");
  let rootCount = 0;
  singleRootedList.forEach((tag) => {
    const elements = txt.getElementsByTagName(tag);
    rootCount += elements.length;
  });
  if (rootCount > 1) {
    return true;
  }
  rootCount = 0;
  forbiddenList.forEach((tag) => {
    const elements = txt.getElementsByTagName(tag);
    rootCount += elements.length;
  });
  if (rootCount > 0) {
    return true;
  }
  const stripped = stripHTML(description);
  return stripped?.length > 250;
}

function JobDescription(props) {
  const { investibleId, marketId, comments, showAssigned=true, inboxMessageId,
    removeActions, showVoting, selectedInvestibleIdParent, setSelectedInvestibleIdParent, preserveOrder,
    showAttachments, toggleCompression, useCompression, isSingleTaskDisplay = false,
    showDiff = false } = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const investibleEditClasses = useInvestibleEditStyles();
  const planningClasses = usePlanningInvestibleStyles();
  const attachedStyles = attachedFilesStyles();
  const fileBaseUrl = config.file_download_configuration.baseURL;
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
  const { name, description, attached_files: attachedFiles } = myInvestible || {};
  const editorIsEmpty = editorEmpty(description);
  const todoComments = comments?.filter((comment) => comment.comment_type === TODO_TYPE);
  const nonTodoComments = comments?.filter((comment) => comment.comment_type !== TODO_TYPE);
  const nonTodoCommentsRoots = nonTodoComments?.filter((comment) => comment.comment_type !== REPLY_TYPE);
  const normalDescriptionDisplay = showDiff || !isLargeDisplay(description);
  const fullDescription = <DescriptionOrDiff id={investibleId} description={description} showDiff={showDiff} />;

  return (
    <>
      <div style={{paddingLeft: '4px', paddingRight: '4px' }}>
        {investibleId && (
          <div
            style={{ display: mobileLayout ? undefined : 'flex', paddingBottom: mobileLayout ? '1.5rem' : undefined }}>
            <Typography className={investibleEditClasses.title} variant="h3" component="h1"
                        style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                        onClick={() => navigate(history, formInvestibleLink(marketId, investibleId))}>
              {name}
            </Typography>
            {!_.isEmpty(assignedPresences) && showAssigned && (
              <div className={planningClasses.assignments}
                   style={{ paddingLeft: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <b style={{ marginRight: '1rem' }}><FormattedMessage id="planningInvestibleAssignments"/></b>
                <GravatarGroup users={assignedPresences} gravatarClassName={classes.smallGravatar}/>
              </div>
            )}
          </div>
        )}
        {!editorIsEmpty && (
          !normalDescriptionDisplay ?
            <CompressedDescription description={description} expansionPanel={fullDescription}/> : fullDescription
        )}
        {showAttachments && (
          <>
            <div className={attachedStyles.sectionTitle}>
              <FormattedMessage id="attachedFilesSection"/>
            </div>
            <div>
              {displayLinksList(attachedFiles, fileBaseUrl, undefined, undefined,
                attachedStyles)}
            </div>
          </>
        )}
        {!_.isEmpty(todoComments) && !isSingleTaskDisplay && (
          <CondensedTodos comments={todoComments} investibleComments={comments} isInbox marketId={marketId}
                          marketInfo={marketInfo}/>
        )}
        {(!_.isEmpty(nonTodoCommentsRoots) || isSingleTaskDisplay) && (
          <div style={{
            paddingTop: investibleId && _.isEmpty(todoComments) ? '1rem' : undefined, paddingBottom: '0.5rem',
            paddingLeft: '0.25rem', paddingRight: mobileLayout ? '0.5rem' : '10rem', overflowY: 'hidden',
            overflowX: 'hidden' }}>
            <CommentBox
              comments={isSingleTaskDisplay ? comments : nonTodoComments}
              preserveOrder={preserveOrder}
              marketId={marketId}
              allowedTypes={[]}
              fullStage={getFullStage(marketStagesState, marketId, marketInfo.stage) || {}}
              investible={inv}
              marketInfo={marketInfo}
              isInbox
              toggleCompression={toggleCompression}
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