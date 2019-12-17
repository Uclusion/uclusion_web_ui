import React, { useState, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { Typography } from '@material-ui/core';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from '../Voting/YourVoting';
import Voting from './Voting';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE,
} from '../../../constants/comments';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import Screen from '../../../containers/Screen/Screen';
import { formMarketLink, makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import InvestibleEditActionButton from '../InvestibleEditActionButton';
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges';
import MoveToCurrentVotingActionButton from './MoveToCurrentVotingActionButton';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';

/**
 * A page that represents what the investible looks like for a DECISION Dialog
 * @param props
 * @constructor
 */
function DecisionInvestible(props) {
  const {
    investibleId,
    marketPresences,
    investibleComments,
    userId,
    market,
    fullInvestible,
    toggleEdit,
    isAdmin,
  } = props;

  const intl = useIntl();
  const history = useHistory();


  const { name: marketName, id: marketId } = market;
  const breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const { investible, market_infos } = fullInvestible;
  const marketInfo = market_infos.find((info) => info.market_id === marketId);

  const [marketStagesState] = useContext(MarketStagesContext);
  const inProposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const inProposed = marketInfo.stage === inProposedStage.id;

  const {
    description, name, created_by: createdBy, locked_by: lockedBy,
  } = investible;
  let lockedByName;
  if (lockedBy) {
    const lockedByPresence = marketPresences.find((presence) => presence.id === lockedBy);
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }

  const commentAddRef = useRef(null);

  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
  }

  function closeCommentAdd() {
    setCommentAddHidden(true);
  }

  const sidebarActions = [];

  if (isAdmin) {
    sidebarActions.push(<InvestibleEditActionButton key="edit" onClick={toggleEdit} />);
    if (inProposed) {
      sidebarActions.push(<MoveToCurrentVotingActionButton
        investibleId={investibleId}
        marketId={marketId}
      />);
    }
  }

  if (inProposed && createdBy === userId) {
    sidebarActions.push(<InvestibleEditActionButton key="edit" onClick={toggleEdit} />);
  }

  sidebarActions.push(<RaiseIssue key="issue" onClick={commentButtonOnClick} />);
  sidebarActions.push(<AskQuestions key="question" onClick={commentButtonOnClick} />);
  sidebarActions.push(<SuggestChanges key="suggest" onClick={commentButtonOnClick} />);

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }

  const hasDiscussion = !_.isEmpty(investmentReasonsRemoved);
  const discussionVisible = !commentAddHidden || hasDiscussion;

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={false}
      sidebarActions={sidebarActions}
    >
      {inProposed && lockedBy && (
        <Typography>
          {intl.formatMessage({ id: 'lockedBy' }, { x: lockedByName })}
        </Typography>
      )}
      {!inProposed && (
        <SubSection
          title={intl.formatMessage({ id: 'decisionInvestibleYourVoting' })}
        >
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            market={market}
          />
        </SubSection>
      )}
      {!inProposed && (
        <SubSection
          title={intl.formatMessage({ id: 'decisionInvestibleOthersVoting' })}
        >
          <Voting
            investibleId={investibleId}
            marketPresences={marketPresences}
            investmentReasons={investmentReasons}
          />
        </SubSection>
      )}
      <SubSection
        title={intl.formatMessage({ id: 'decisionInvestibleDescription' })}
      >
        <ReadOnlyQuillEditor
          value={description}
        />
      </SubSection>
      {discussionVisible && (
        <SubSection
          title={intl.formatMessage({ id: 'decisionInvestibleDiscussion' })}
        >
          <div ref={commentAddRef}>
            <CommentAddBox
              hidden={commentAddHidden}
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              type={commentAddType}
              onSave={closeCommentAdd}
              onCancel={closeCommentAdd}
            />
          </div>
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId} />
        </SubSection>
      )}
    </Screen>
  );
}

DecisionInvestible.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  commentsHash: PropTypes.object,
  investibleId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  toggleEdit: PropTypes.func,
  isAdmin: PropTypes.bool,
};

DecisionInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  commentsHash: {},
  toggleEdit: () => {
  },
  isAdmin: false,
};
export default DecisionInvestible;
