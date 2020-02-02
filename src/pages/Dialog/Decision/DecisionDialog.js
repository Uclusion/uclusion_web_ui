/**
 * A component that renders a _decision_ dialog
 */
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import { Grid } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import EditAttributesIcon from '@material-ui/icons/EditAttributes';
import {
  formMarketAddInvestibleLink,
  makeBreadCrumbs,
  navigate,
  formMarketEditLink, formMarketManageLink, makeArchiveBreadCrumbs,
} from '../../../utils/marketIdPathFunctions';
import Summary from '../Summary';
import ProposedIdeas from './ProposedIdeas';
import SubSection from '../../../containers/SubSection/SubSection';
import CurrentVoting from './CurrentVoting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import Screen from '../../../containers/Screen/Screen';
import { getCommentTypeIcon, scrollToCommentAddBox } from '../../../components/Comments/commentFunctions';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments';
import { SECTION_TYPE_SECONDARY } from '../../../constants/global';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';
import { getDialogTypeIcon } from '../../../components/Dialogs/dialogIconFunctions';
import GroupAddIcon from '@material-ui/icons/GroupAdd';
import { ACTIVE_STAGE, DECISION_TYPE } from '../../../constants/markets'
import UclusionTour from '../../../components/Tours/UclusionTour';
import {
  PURE_SIGNUP_ADD_DIALOG_OPTIONS,
  PURE_SIGNUP_ADD_DIALOG_OPTIONS_STEPS
} from '../../../components/Tours/pureSignupTours';

function DecisionDialog(props) {
  const {
    market,
    hidden,
    investibles,
    comments,
    marketStages,
    marketPresences,
    myPresence,
  } = props;

  const commentAddRef = useRef(null);
  const intl = useIntl();
  const {
    name: marketName,
    market_stage: marketStage,
  } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const {
    is_admin: isAdmin,
  } = myPresence;
  const underConsiderationStage = marketStages.find((stage) => stage.allows_investment);
  const proposedStage = marketStages.find((stage) => !stage.allows_investment);
  const history = useHistory();
  const breadCrumbs = (myPresence && myPresence.market_hidden)?
    makeArchiveBreadCrumbs(history) :
    makeBreadCrumbs(history);
  const investibleComments = comments.filter((comment) => comment.investible_id);
  const marketComments = comments.filter((comment) => !comment.investible_id);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE];


  const participantTourSteps = [
  ];
  const tourSteps = isAdmin? PURE_SIGNUP_ADD_DIALOG_OPTIONS_STEPS : participantTourSteps;
  const tourName = isAdmin? PURE_SIGNUP_ADD_DIALOG_OPTIONS : '';
  const addLabel = isAdmin ? 'decisionDialogAddInvestibleLabel' : 'decisionDialogProposeInvestibleLabel';
  function getInvestiblesForStage(stage) {
    if (stage) {
      return investibles.reduce((acc, inv) => {
        const { market_infos: marketInfos } = inv;
        for (let x = 0; x < marketInfos.length; x += 1) {
          if (marketInfos[x].stage === stage.id) {
            return [...acc, inv];
          }
        }
        return acc;
      }, []);
    }
    return [];
  }
  const underConsideration = getInvestiblesForStage(underConsiderationStage);
  const proposed = getInvestiblesForStage(proposedStage);

  const { id: marketId } = market;

  function closeCommentAddBox() {
    setCommentAddHidden(true);
  }

  function toggleAddParticipantsMode() {
    navigate(history, formMarketManageLink(marketId));
  }

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
    scrollToCommentAddBox(commentAddRef);
  }

  const manageDialog = {
    label: intl.formatMessage({ id: 'dialogManageLabel' }),
    id: 'manageDialog',
    icon: <EditAttributesIcon />,
    onClick: () => toggleAddParticipantsMode(),
  };

  const addParticipants = {
    label: intl.formatMessage({ id: 'dialogAddParticipantsLabel' }),
    icon: <GroupAddIcon />,
    onClick: () => toggleAddParticipantsMode(),
  };
  const manageAction = isAdmin ? manageDialog : addParticipants;

  const sidebarMenuList = [manageAction];
  if (activeMarket) {
    sidebarMenuList.unshift({
      label: intl.formatMessage({ id: addLabel }),
      icon: <AddIcon />,
      id: "newOption",
      onClick: () => navigate(history, formMarketAddInvestibleLink(marketId)),
    });
    sidebarMenuList.push({
      label: intl.formatMessage({ id: 'commentIconRaiseIssueLabel' }),
      icon: getCommentTypeIcon(ISSUE_TYPE),
      onClick: () => commentButtonOnClick(ISSUE_TYPE),
    });
    sidebarMenuList.push({
      label: intl.formatMessage({ id: 'commentIconAskQuestionLabel' }),
      icon: getCommentTypeIcon(QUESTION_TYPE),
      onClick: () => commentButtonOnClick(QUESTION_TYPE),
    });
  }

  const adminMenuList = [
    {
      label: intl.formatMessage({ id: 'dialogEditButtonTooltip' }),
      icon: <EditIcon />,
      onClick: () => navigate(history, formMarketEditLink(marketId)),
    },
  ];

  function getSidebarActions() {
    if (isAdmin && activeMarket) {
      sidebarMenuList.unshift(...adminMenuList);
    }

    return sidebarMenuList.map((item, index) => {
      const { onClick, label, icon, id } = item;
      if (item.spinBlocking) {
        return (
          <SpinBlockingSidebarAction
            id={id}
            key={index}
            label={label}
            onClick={onClick}
            icon={icon}
            marketId={marketId}
          />
        );
      }
      return <ExpandableSidebarAction id={id} key={index} label={label} icon={icon} onClick={onClick} />;
    });
  }

  const sidebarActions = getSidebarActions();
  return (
    <Screen
      title={marketName}
      tabTitle={marketName}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      sidebarActions={sidebarActions}
    >
      <UclusionTour
        shouldRun={!hidden}
        name={tourName}
        steps={tourSteps}
        continuous
        hideBackButton
      />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SubSection
            title={intl.formatMessage({ id: 'decisionDialogSummaryLabel' })}
            titleIcon={getDialogTypeIcon(DECISION_TYPE)}
            id="summary"
          >
            <Summary market={market} />
          </SubSection>
        </Grid>
        <Grid item xs={12} style={{ marginTop: '30px' }}>
          <SubSection
            id="currentVoting"
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel' })}
          >
            <CurrentVoting
              marketPresences={marketPresences}
              investibles={underConsideration}
              marketId={marketId}
              comments={investibleComments}
            />
          </SubSection>
        </Grid>

        <Grid item xs={12} style={{ marginTop: '56px' }}>
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogProposedOptionsLabel' })}
          >
            <ProposedIdeas
              investibles={proposed}
              marketId={marketId}
              comments={investibleComments}
            />
          </SubSection>
        </Grid>
        <Grid item xs={12} style={{ marginTop: '71px' }}>
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogDiscussionLabel' })}
          >
            {!commentAddHidden && (
              <CommentAddBox
                type={commentAddType}
                allowedTypes={allowedCommentTypes}
                marketId={marketId}
                issueWarningId="issueWarning"
                onSave={closeCommentAddBox}
                onCancel={closeCommentAddBox}
              />
            )}
            <div ref={commentAddRef} />
            <CommentBox
              comments={marketComments}
              marketId={marketId}
            />
          </SubSection>
        </Grid>
      </Grid>
    </Screen>
  );
}

DecisionDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketStages: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  myPresence: PropTypes.object.isRequired,
  hidden: PropTypes.bool,

};

DecisionDialog.defaultProps = {
  investibles: [],
  comments: [],
  marketStages: [],
  hidden: false,
};

export default DecisionDialog;
