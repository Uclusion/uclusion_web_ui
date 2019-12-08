import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Paper } from '@material-ui/core';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from '../Decision/Voting/YourVoting';
import Voting from '../Decision/Voting';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE,
} from '../../../constants/comments';
import DisplayAssignments from './Assignments/DisplayAssignments';
import { formMarketLink, makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import Screen from '../../../containers/Screen/Screen';
import InvestibleEditActionButton from '../InvestibleEditActionButton';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import MoveToNextVisibleStageActionButton from './MoveToNextVisibleStageActionButton';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getInReviewStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import MoveToVerifiedActionButton from './MoveToVerifiedActionButton';
import MoveToNotDoingActionButton from './MoveToNotDoingActionButton';
import { scrollToCommentAddBox } from '../../../components/Comments/commentFunctions';

/**
 * A page that represents what the investible looks like for a DECISION Dialog
 * @param props
 * @constructor
 */
function PlanningInvestible(props) {
  const history = useHistory();
  const intl = useIntl();
  const {
    investibleId,
    marketPresences,
    investibleComments,
    userId,
    market,
    marketInvestible,
    toggleEdit,
    isAdmin,
  } = props;
  const { name: marketName, id: marketId } = market;
  const breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const marketInfo = getMarketInfo(marketInvestible, marketId);
  const { stage, assigned } = marketInfo;
  const { investible } = marketInvestible;
  const { description, name } = investible;
  const commentAddRef = useRef(null);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inReviewStage = getInReviewStage(marketStagesState, marketId);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE];

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
    scrollToCommentAddBox(commentAddRef);
  }

  function closeCommentAdd() {
    setCommentAddHidden(true);
  }

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }
  const sidebarActions = [];

  if (isAdmin) {
    sidebarActions.push(<InvestibleEditActionButton key="edit" onClick={toggleEdit}/>);
  }
  if (assigned && assigned.includes(userId)) {
    if (stage !== inReviewStage.id) {
      const invested = marketPresences.filter((presence) => {
        const { investments } = presence;
        if (!Array.isArray(investments) || investments.length === 0) {
          return false;
        }
        let found = false;
        investments.forEach((investment) => {
          const { investible_id: invId } = investment;
          if (invId === investibleId) {
            found = true;
          }
        });
        return found;
      });
      if (Array.isArray(invested) && invested.length > 0) {
        sidebarActions.push(<MoveToNextVisibleStageActionButton
          investibleId={investibleId}
          marketId={marketId}
          stageId={stage}
        />);
      }
    }
    sidebarActions.push(<MoveToVerifiedActionButton
      investibleId={investibleId}
      marketId={marketId}
      stageId={stage}
    />);
    sidebarActions.push(<MoveToNotDoingActionButton
      investibleId={investibleId}
      marketId={marketId}
      stageId={stage}
    />);
  }
  sidebarActions.push(<RaiseIssue key="issue" onClick={commentButtonOnClick}/>);
  sidebarActions.push(<AskQuestions key="question" onClick={commentButtonOnClick}/>);

  const discussionVisible = !commentAddHidden || !_.isEmpty(investmentReasonsRemoved);

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={false}
      sidebarActions={sidebarActions}
    >
      {(!assigned || !assigned.includes(userId)) && (
        <SubSection
          title="Your Voting"
        >
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            marketId={marketId}
            showBudget
          />
        </SubSection>
      )}
      <SubSection
        title="Others Voting"
      >
        <Voting
          investibleId={investibleId}
          marketPresences={marketPresences}
          investmentReasons={investmentReasons}
        />
      </SubSection>
      <SubSection
        title="Assignments"
      >
        {marketId && investible && (
          <DisplayAssignments
            marketId={marketId}
            marketPresences={marketPresences}
            investible={marketInvestible}
          />
        )}
      </SubSection>
      <SubSection
        title="Description"
      >
        <Paper>
          <ReadOnlyQuillEditor
            value={description}
          />

        </Paper>
      </SubSection>
      <div ref={commentAddRef}>
      {discussionVisible && (
        <SubSection
          title={intl.formatMessage({ id: 'decisionInvestibleDiscussion' })}
        >
            <CommentAddBox
              hidden={commentAddHidden}
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              type={commentAddType}
              onSave={closeCommentAdd}
              onCancel={closeCommentAdd}
            />
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId}/>
        </SubSection>
      )}
      </div>

    </Screen>
  );
}

PlanningInvestible.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  toggleEdit: PropTypes.func,
  isAdmin: PropTypes.bool,
};

PlanningInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  toggleEdit: () => {
  },
  isAdmin: false,
};
export default PlanningInvestible;
