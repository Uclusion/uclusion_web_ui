import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { Typography, Grid } from '@material-ui/core';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from '../Voting/YourVoting';
import Voting from '../Decision/Voting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE,
} from '../../../constants/comments';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import Screen from '../../../containers/Screen/Screen';
import {
  formMarketManageLink, makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate,
} from '../../../utils/marketIdPathFunctions';
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges';
import { ACTIVE_STAGE, INITIATIVE_TYPE } from '../../../constants/markets';
import AddParticipantsActionButton from '../../Dialog/AddParticipantsActionButton';
import { SECTION_TYPE_SECONDARY } from '../../../constants/global';
import { getDialogTypeIcon } from '../../../components/Dialogs/dialogIconFunctions';
import Summary from '../../Dialog/Summary';

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
    isAdmin,
    inArchives,
    hidden,
  } = props;

  const intl = useIntl();
  const history = useHistory();
  // eslint-disable-next-line max-len
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  // eslint-disable-next-line max-len
  const myIssues = investmentReasonsRemoved.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved);
  // eslint-disable-next-line max-len
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const { investible } = fullInvestible;
  const { description, name } = investible;
  const {
    id: marketId,
    market_stage: marketStage,
  } = market;
  const breadCrumbs = inArchives ? makeArchiveBreadCrumbs(history) : makeBreadCrumbs(history);
  const commentAddRef = useRef(null);
  const activeMarket = marketStage === ACTIVE_STAGE;
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const hasIssue = !_.isEmpty(myIssues);

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
  }

  function closeCommentAdd() {
    setCommentAddHidden(true);
  }

  function toggleAddParticipantsMode() {
    navigate(history, formMarketManageLink(marketId));
  }

  function getSidebarActions() {
    if (!activeMarket) {
      return [];
    }
    const sidebarActions = [];

    sidebarActions.push(<AddParticipantsActionButton key="addParticipants" onClick={toggleAddParticipantsMode} />);
    sidebarActions.push(<RaiseIssue key="issue" onClick={commentButtonOnClick} />);
    sidebarActions.push(<AskQuestions key="question" onClick={commentButtonOnClick} />);
    sidebarActions.push(<SuggestChanges key="suggest" onClick={commentButtonOnClick} />);
    return sidebarActions;
  }

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
      sidebarActions={getSidebarActions()}
      hidden={hidden}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SubSection
            title={intl.formatMessage({ id: 'decisionInvestibleDescription' })}
            titleIcon={getDialogTypeIcon(INITIATIVE_TYPE)}
          >
            <Summary
              hidden={hidden}
              market={market}
              investibleId={investibleId}
              investibleName={name}
              investibleDescription={description}
            />
          </SubSection>
        </Grid>
        {!isAdmin && (
          <Grid item xs={12}>

            <SubSection
              type={SECTION_TYPE_SECONDARY}
              title={intl.formatMessage({ id: 'initiativeInvestibleYourVoting' })}
            >
              {hasIssue && (
                <Typography>
                  {intl.formatMessage({ id: 'initiativeInvestibleVotingBlocked' })}
                </Typography>
              )}
              {!hasIssue && (
                <YourVoting
                  investibleId={investibleId}
                  marketPresences={marketPresences}
                  comments={investmentReasons}
                  userId={userId}
                  market={market}
                />
              )}
            </SubSection>
          </Grid>
        )}
        <Grid item xs={12}>

          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'initiativeInvestibleOthersVoting' })}
          >
            <Voting
              investibleId={investibleId}
              marketPresences={marketPresences}
              investmentReasons={investmentReasons}
            />
          </SubSection>
        </Grid>
        {discussionVisible && (
          <Grid item xs={12}>

            <SubSection
              type={SECTION_TYPE_SECONDARY}
              title={intl.formatMessage({ id: 'initiativeInvestibleDiscussion' })}
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
              <div ref={commentAddRef} />
              <CommentBox comments={investmentReasonsRemoved} marketId={marketId} />
            </SubSection>
          </Grid>
        )}
      </Grid>
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
  isAdmin: PropTypes.bool,
  inArchives: PropTypes.bool,
  hidden: PropTypes.bool,
};

InitiativeInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  isAdmin: false,
  inArchives: false,
  hidden: false,
};
export default InitiativeInvestible;
