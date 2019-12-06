import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from '../Decision/Voting/YourVoting';
import Voting from '../Decision/Voting';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE,
} from '../../../constants/comments';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import Screen from '../../../containers/Screen/Screen';
import { makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import InvestibleEditActionButton from '../InvestibleEditActionButton';
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges';

/**
 * A page that represents what the investible looks like for a DECISION Dialog
 * @param props
 * @constructor
 */
function InitiativeInvestible(props) {
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
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const { investible } = fullInvestible;
  const { description, name } = investible;
  const { id: marketId } = market;
  const breadCrumbs = makeBreadCrumbs(history);
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
      breadCrumbs={breadCrumbs}
      hidden={false}
      sidebarActions={sidebarActions}
    >
      {!isAdmin && (
      <SubSection
        title={intl.formatMessage({ id: 'decisionInvestibleYourVoting' })}
      >
        <YourVoting
          investibleId={investibleId}
          marketPresences={marketPresences}
          comments={investmentReasons}
          userId={userId}
          marketId={marketId}
        />
      </SubSection>
      )}
      <SubSection
        title={intl.formatMessage({ id: 'decisionInvestibleOthersVoting' })}
      >
        <Voting
          investibleId={investibleId}
          marketPresences={marketPresences}
          investmentReasons={investmentReasons}
        />
      </SubSection>
      <SubSection
        title={intl.formatMessage({ id: 'decisionInvestibleDescription' })}
      >
        <QuillEditor
          readOnly
          defaultValue={description}
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

InitiativeInvestible.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  toggleEdit: PropTypes.func,
  isAdmin: PropTypes.bool,
};

InitiativeInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  toggleEdit: () => {},
  isAdmin: false,
};
export default InitiativeInvestible;
