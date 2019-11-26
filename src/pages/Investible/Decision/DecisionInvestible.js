import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from './Voting/YourVoting';
import Voting from './Voting';
import { Paper } from '@material-ui/core';

import QuillEditor from '../../../components/TextEditors/QuillEditor';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import Screen from '../../../containers/Screen/Screen';
import { useHistory } from 'react-router';
import { formMarketLink, makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import InvestibleEditActionButton from '../InvestibleEditActionButton';
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges';
import { useIntl } from 'react-intl';

/**
 * A page that represents what the investible looks like for a DECISION Dialog
 * @param props
 * @constructor
 */
function DecisionInvestible(props) {

  const {
    hidden,
    investibleId,
    marketPresences,
    investibleComments,
    userId,
    market,
    investible,
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
  const { description, name } = investible;

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
    return <React.Fragment />;
  }

  return (
    <Screen
      title={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      sidebarActions={sidebarActions}
    >

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

      <SubSection
        title={intl.formatMessage({ id: 'decisionInvestibleOthersVoting' })}
      >
        <Voting
          investibleId={investibleId}
          marketPresences={marketPresences}
          comments={investmentReasons}
        />
      </SubSection>
      <SubSection
        title={intl.formatMessage({ id: 'decisionInvestibleDescription' })}
      >
        <Paper>
          <QuillEditor
            readOnly
            defaultValue={description}
          />

        </Paper>
      </SubSection>
      <SubSection
        title={ intl.formatMessage({ id: 'decisionInvestibleDiscussion' })}
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

    </Screen>
  );
}

DecisionInvestible.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  investible: PropTypes.object.isRequired,
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
  hidden: PropTypes.bool,

};

DecisionInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  commentsHash: {},
  toggleEdit: () => {},
  isAdmin: false,
  hidden: false,
};
export default DecisionInvestible;