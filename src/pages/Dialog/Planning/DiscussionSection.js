import React, { useContext, useEffect, useReducer } from 'react';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router';
import _ from 'lodash';
import { Box, Grid, IconButton, Link, useMediaQuery, useTheme } from '@material-ui/core';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getSortedRoots } from '../../../containers/CommentBox/CommentBox';
import DismissableText from '../../../components/Notifications/DismissableText';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import { CheckCircleOutline } from '@material-ui/icons';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import { DISCUSSION_WIZARD_TYPE } from '../../../constants/markets';
import { QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { formMarketAddCommentLink, navigate, removeHash } from '../../../utils/marketIdPathFunctions';
import BugListItem from '../../../components/Comments/BugListItem';
import Comment from '../../../components/Comments/Comment';
import getReducer, { PAGE_SIZE, pin, setPage, setTab } from '../../../components/Comments/BugListContext';
import { getPaginatedItems, getRealPage } from '../../../utils/messageUtils';
import { getThreadIds } from '../../../utils/commentFunctions';
import { updateComment } from '../../../api/comments';
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { removeMessagesForCommentId } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { stripHTML } from '../../../utils/stringFunctions';
import { KeyboardArrowLeft } from '@material-ui/icons';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { hasDiscussionComment } from '../../../components/AddNewWizards/Discussion/AddCommentStep';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';

function DiscussionSection(props) {
  const {
    comments = [],
    resolvedComments = [],
    marketId,
    groupId,
    isSupport = false,
    hidden,
  } = props;

  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { hash } = location;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const wizardClasses = wizardStyles();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const isSearchActive = !_.isEmpty(search);

  const [sectionState, sectionDispatch] = useReducer(getReducer(),
    { page: 1, tabIndex: 0, expansionState: {}, pageState: {}, defaultPage: 1 });
  const { tabIndex, page: originalPage, expansionState = {}, pinned } = sectionState;

  const resolvedRoots = _.orderBy(
    resolvedComments.filter(c => [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE].includes(c.comment_type)),
    ['updated_at'], ['desc']
  );

  useEffect(() => {
    if (hash && !hidden) {
      const resolvedCommentIds = getThreadIds(resolvedComments, comments);
      const foundCommentId = resolvedCommentIds.find((anId) => hash.includes(anId));
      if (foundCommentId) {
        const foundComment = resolvedComments.find((comment) => comment.id === foundCommentId);
        const { root_comment_id: rootId } = foundComment;
        const rootComment = !rootId ? foundComment : resolvedComments.find((comment) => comment.id === rootId);
        if (rootComment) {
          sectionDispatch(setTab(1));
          sectionDispatch(pin(rootComment.id));
          removeHash(history);
        }
      } else if (tabIndex === 1) {
        // A link to an open comment must switch back to the open tab or it won't be in the DOM to scroll to
        const openParents = comments.filter((comment) =>
          [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE].includes(comment.comment_type));
        const openCommentIds = getThreadIds(openParents, comments);
        if (openCommentIds.find((anId) => hash.includes(anId))) {
          sectionDispatch(setTab(0));
        }
      }
    }
    return () => {};
  }, [comments, resolvedComments, hash, history, tabIndex]);

  const sortedRoots = getSortedRoots(comments, searchResults);
  const questionSuggestionNotesComments = sortedRoots.filter(c =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE].includes(c.comment_type));

  // During search: combine open + resolved into a single paginated compressed list (per Q-all-66 O-1)
  const searchResolvedRoots = isSearchActive ? resolvedRoots.filter((c) =>
    results.find((item) => item.id === c.id) || parentResults.find((id) => id === c.id)
  ) : [];
  const searchUnifiedItems = isSearchActive
    ? _.orderBy([...questionSuggestionNotesComments, ...searchResolvedRoots], ['updated_at'], ['desc'])
    : [];
  const page = getRealPage(isSearchActive ? searchUnifiedItems : resolvedRoots, pinned, originalPage, PAGE_SIZE);
  const searchPaginated = getPaginatedItems(searchUnifiedItems, page, PAGE_SIZE);

  const resolvedPaginated = getPaginatedItems(resolvedRoots, page, PAGE_SIZE);
  const { first, last, data, hasMore, hasLess } = isSearchActive ? searchPaginated : resolvedPaginated;

  function onDropUnresolve(event) {
    const commentId = event.dataTransfer.getData('text');
    const wasResolved = event.dataTransfer.getData('resolved') === 'true';
    if (!wasResolved) {
      return Promise.resolve(false);
    }
    setOperationRunning(true);
    removeMessagesForCommentId(commentId, messagesState);
    const target = event.target;
    target.style.cursor = 'wait';
    return updateComment({ marketId, commentId, resolved: false })
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        setOperationRunning(false);
      }).finally(() => {
        target.style.cursor = 'pointer';
        setOperationRunning(false);
      });
  }

  function changePage(byNum) {
    sectionDispatch(setPage(page + byNum));
  }

  if (hidden) {
    return <React.Fragment />;
  }

  return (
    <div id="discussionSection">
      <div style={{ display: mobileLayout ? undefined : 'flex', marginBottom: '1rem', marginLeft: '0.5rem',
        marginTop: '1rem' }}>
        <SpinningButton id="newMarketReport"
          icon={hasDiscussionComment(groupId, REPORT_TYPE) ? EditIcon : AddIcon}
          iconColor="black"
          className={wizardClasses.actionNext}
          style={{ display: 'flex', marginRight: mobileLayout ? undefined : '2rem' }}
          variant="text" doSpin={false} toolTipId='hotKeyREPORT'
          onClick={() => navigate(history, formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, REPORT_TYPE))}>
          {intl.formatMessage({ id: `createNote${mobileLayout ? 'Mobile' : ''}` })}
        </SpinningButton>
        <SpinningButton id="newMarketQuestion"
          icon={hasDiscussionComment(groupId, QUESTION_TYPE) ? EditIcon : AddIcon}
          iconColor="black"
          className={wizardClasses.actionNext}
          style={{ display: 'flex', marginRight: mobileLayout ? undefined : '2rem' }}
          variant="text" doSpin={false} toolTipId='hotKeyQUESTION'
          onClick={() => navigate(history, formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, QUESTION_TYPE))}>
          {intl.formatMessage({ id: `createQuestion${mobileLayout ? 'Mobile' : ''}` })}
        </SpinningButton>
        <SpinningButton id="createSuggestion"
          icon={hasDiscussionComment(groupId, SUGGEST_CHANGE_TYPE) ? EditIcon : AddIcon}
          iconColor="black"
          className={wizardClasses.actionNext}
          style={{ display: 'flex' }}
          variant="text" doSpin={false} toolTipId='hotKeySUGGEST'
          onClick={() => navigate(history, formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, SUGGEST_CHANGE_TYPE))}>
          {intl.formatMessage({ id: `createSuggestion${mobileLayout ? 'Mobile' : ''}` })}
        </SpinningButton>
      </div>
      {!isSearchActive && _.isEmpty(questionSuggestionNotesComments) && (
        <div style={{ marginTop: '2.5rem' }} />
      )}
      <DismissableText textId="workspaceCommentHelp" display={!isSearchActive && _.isEmpty(questionSuggestionNotesComments)}
        isLeft noPad text={
          isSupport ?
            <div>Ask a question or make a suggestion and Uclusion support will respond.</div>
            :
            <div>
              <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">Questions and suggestions</Link> can
              be used at the view level and later moved to a job.
            </div>
        } />

      {/* During search: show all matching items (open + resolved) as compressed paginated rows */}
      {isSearchActive && (
        <div style={{ overflowX: 'hidden' }}>
          {!_.isEmpty(data) && (
            <div style={{ paddingBottom: '0.25rem' }}>
              <div style={{ display: 'flex', width: '80%' }}>
                <div style={{ flexGrow: 1 }} />
                <Box fontSize={14} color="text.secondary">
                  {first} - {last} of {_.size(searchUnifiedItems)}
                  <IconButton disabled={!hasLess} onClick={() => changePage(-1)}>
                    <KeyboardArrowLeft />
                  </IconButton>
                  <IconButton disabled={!hasMore} onClick={() => changePage(1)}>
                    <KeyboardArrowRight />
                  </IconButton>
                </Box>
              </div>
            </div>
          )}
          {data.map((comment) => {
            const allComments = [...comments, ...resolvedComments];
            const replies = allComments.filter(c => c.root_comment_id === comment.id);
            const expansionPanel = (
              <div id={`c${comment.id}`} key={`c${comment.id}key`} style={{ marginBottom: '1rem' }}>
                <Comment
                  marketId={marketId}
                  comment={comment}
                  comments={allComments}
                  allowedTypes={[]}
                />
              </div>
            );
            return (
              <BugListItem
                key={comment.id}
                id={comment.id}
                replyNum={replies.length + 1}
                title={stripHTML(comment.body)}
                date={intl.formatDate(comment.updated_at)}
                marketId={marketId}
                groupId={groupId}
                useSelect={false}
                expansionPanel={expansionPanel}
                expansionOpen={!!expansionState[comment.id]}
                bugListDispatch={sectionDispatch}
                isResolved={!!comment.resolved}
              />
            );
          })}
        </div>
      )}

      {!isSearchActive && (
        <>
          <GmailTabs
            value={tabIndex}
            onChange={(event, value) => sectionDispatch(setTab(value))}
            indicatorColors={['#2F80ED', '#bdbdbd']}
            style={{ paddingBottom: '1rem', paddingTop: '1rem' }}
          >
            <GmailTabItem
              label={intl.formatMessage({ id: 'openHeader' })}
              color='black'
              onDrop={onDropUnresolve}
              onDragOver={(event) => event.preventDefault()}
            />
            <GmailTabItem
              icon={<CheckCircleOutline />}
              label={intl.formatMessage({ id: 'resolvedBugsHeader' })}
              color='black'
            />
          </GmailTabs>

          {tabIndex === 0 && (
            <Grid item id="discussionAddArea" xs={12}>
              <CommentBox comments={comments} marketId={marketId} />
            </Grid>
          )}

          {tabIndex === 1 && (
            <div style={{ overflowX: 'hidden' }}>
              {!_.isEmpty(data) && (
                <div style={{ paddingBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', width: '80%' }}>
                    <div style={{ flexGrow: 1 }} />
                    <Box fontSize={14} color="text.secondary">
                      {first} - {last} of {_.size(resolvedRoots)}
                      <IconButton disabled={!hasLess} onClick={() => changePage(-1)}>
                        <KeyboardArrowLeft />
                      </IconButton>
                      <IconButton disabled={!hasMore} onClick={() => changePage(1)}>
                        <KeyboardArrowRight />
                      </IconButton>
                    </Box>
                  </div>
                </div>
              )}
              {_.isEmpty(data) && (
                <div style={{ marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto',
                  fontSize: '1rem' }}>
                  {intl.formatMessage({ id: 'resolvedBugsHeader' })} is empty.<br /><br />
                  Resolved notes, questions, and suggestions display here. Drag to the Open tab to unresolve.
                </div>
              )}
              {data.map((comment) => {
                const replies = resolvedComments.filter(c => c.root_comment_id === comment.id);
                const expansionPanel = (
                  <div id={`c${comment.id}`} key={`c${comment.id}key`} style={{ marginBottom: '1rem' }}>
                    <Comment
                      marketId={marketId}
                      comment={comment}
                      comments={[...comments, ...resolvedComments]}
                      allowedTypes={[]}
                    />
                  </div>
                );
                return (
                  <BugListItem
                    key={comment.id}
                    id={comment.id}
                    replyNum={replies.length + 1}
                    title={stripHTML(comment.body)}
                    date={intl.formatDate(comment.updated_at)}
                    marketId={marketId}
                    groupId={groupId}
                    useSelect={false}
                    expansionPanel={expansionPanel}
                    expansionOpen={!!expansionState[comment.id]}
                    bugListDispatch={sectionDispatch}
                    isResolved
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DiscussionSection;
