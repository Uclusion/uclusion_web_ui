import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { Typography } from '@material-ui/core';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from '../Voting/YourVoting';
import Voting from '../Decision/Voting';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE,
} from '../../../constants/comments';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import Screen from '../../../containers/Screen/Screen';
import { formInvestibleLink, makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import InvestibleEditActionButton from '../InvestibleEditActionButton';
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges';
import Summary from '../../Dialog/Summary';
import { ACTIVE_STAGE } from '../../../constants/markets';
import AddParticipantsActionButton from '../../Dialog/AddParticipantsActionButton';
import AddressList from '../../Dialog/AddressList';
import { SECTION_TYPE_SECONDARY } from '../../../constants/global';
import DeadlineExtender from '../../Home/Decision/DeadlineExtender';
import ExtendDeadlineActionButton from '../../Dialog/Decision/ExtendDeadlineActionButton';

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
  const [addParticipantsMode, setAddParticipantsMode] = useState(false);
  // eslint-disable-next-line max-len
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  // eslint-disable-next-line max-len
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const [extendDeadlineMode, setExtendDeadlineMode] = useState(false);
  const { investible } = fullInvestible;
  const { description, name } = investible;
  const {
    id: marketId,
    market_stage: marketStage,
  } = market;
  const breadCrumbs = makeBreadCrumbs(history);
  const commentAddRef = useRef(null);
  const activeMarket = marketStage === ACTIVE_STAGE;
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
  }

  function closeCommentAdd() {
    setCommentAddHidden(true);
  }

  function toggleAddParticipantsMode() {
    setAddParticipantsMode(!addParticipantsMode);
  }

  function getSidebarActions() {
    if (!activeMarket) {
      return [];
    }
    const sidebarActions = [];

    if (isAdmin) {
      sidebarActions.push(<InvestibleEditActionButton key="edit" onClick={toggleEdit}/>);
      sidebarActions.push(<ExtendDeadlineActionButton key="extend" onClick={() => setExtendDeadlineMode(true)}/>);
    }
    sidebarActions.push(<AddParticipantsActionButton key="addParticipants" onClick={toggleAddParticipantsMode}/>);
    sidebarActions.push(<RaiseIssue key="issue" onClick={commentButtonOnClick}/>);
    sidebarActions.push(<AskQuestions key="question" onClick={commentButtonOnClick}/>);
    sidebarActions.push(<SuggestChanges key="suggest" onClick={commentButtonOnClick}/>);
    return sidebarActions;
  }

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }

  if (extendDeadlineMode) {
    return (
      <Screen
        title={name}
        tabTitle={name}
        breadCrumbs={breadCrumbs}
      >
        <div>
          <Typography>
            {intl.formatMessage({ id: 'decisionDialogExtendDaysLabel' })}
          </Typography>

          <DeadlineExtender
            market={market}
            onCancel={() => setExtendDeadlineMode(false)}
            onSave={() => setExtendDeadlineMode(false)}
          />
        </div>
      </Screen>
    );
  }


  if (addParticipantsMode) {
    const participantsTitle = intl.formatMessage({ id: 'addressListHeader' });
    const breadCrumbTemplates = [{ name, link: formInvestibleLink(marketId, investibleId) }];
    const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
    return (
      <Screen
        tabTitle={participantsTitle}
        title={participantsTitle}
        breadCrumbs={myBreadCrumbs}
      >
        <AddressList
          addToMarketId={marketId}
          showObservers={false}
          onCancel={toggleAddParticipantsMode}
          onSave={toggleAddParticipantsMode}
          intl={intl}
        />
      </Screen>
    );
  }

  const hasDiscussion = !_.isEmpty(investmentReasonsRemoved);
  const discussionVisible = !commentAddHidden || hasDiscussion;

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      sidebarActions={getSidebarActions()}
    >
      {!isAdmin && (
        <SubSection
          type={SECTION_TYPE_SECONDARY}
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
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'decisionInvestibleOthersVoting' })}
      >
        <Voting
          investibleId={investibleId}
          marketPresences={marketPresences}
          investmentReasons={investmentReasons}
        />
      </SubSection>
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'decisionInvestibleDescription' })}
      >
        <Summary market={market} showObservers={false}/>
        <ReadOnlyQuillEditor
          value={description}
        />
      </SubSection>
      {discussionVisible && (
        <SubSection
          type={SECTION_TYPE_SECONDARY}
          title={intl.formatMessage({ id: 'decisionInvestibleDiscussion' })}
        >
          {!commentAddHidden && (
            <CommentAddBox
              hidden={commentAddHidden}
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              type={commentAddType}
              onSave={closeCommentAdd}
              onCancel={closeCommentAdd}
            />
          )}
          <div ref={commentAddRef} />
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId}/>
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
  toggleEdit: () => {
  },
  isAdmin: false,
};
export default InitiativeInvestible;
