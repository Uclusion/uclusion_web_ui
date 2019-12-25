/**
 * A component that renders a _decision_ dialog
 */
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';

import { Grid } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import EditIcon from '@material-ui/icons/Edit';
import GroupAddIcon from '@material-ui/icons/GroupAdd';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';

import SidebarMenuButton from '../../../components/Buttons/SidebarMenuButton';
import { scrollToCommentAddBox } from '../../../components/Comments/commentFunctions';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments';
import { SECTION_TYPE_SECONDARY } from '../../../constants/global';
import { ACTIVE_STAGE } from '../../../constants/markets';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import Screen from '../../../containers/Screen/Screen';
import SubSection from '../../../containers/SubSection/SubSection';
import { formMarketLink, makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';

import AddParticipantsActionButton from '../AddParticipantsActionButton';
import AddressList from '../AddressList';
import CurrentVoting from './CurrentVoting';
import DialogEdit from './DialogEdit';
import DialogEditActionButton from './DialogEditActionButton';
import InvestibleAdd from './InvestibleAdd';
import InvestibleAddActionButton from './InvestibleAddActionButton';
import ProposedIdeas from './ProposedIdeas';
import Summary from '../Summary';

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
  const { name: marketName, market_stage: marketStage } = market;
  const { is_admin: isAdmin } = myPresence;
  const underConsiderationStage = marketStages.find((stage) => stage.allows_investment);
  const proposedStage = marketStages.find((stage) => !stage.allows_investment);
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history);
  const investibleComments = comments.filter((comment) => comment.investible_id);
  const marketComments = comments.filter((comment) => !comment.investible_id);
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const [addParticipantsMode, setAddParticipantsMode] = useState(false);
  const [dialogEditMode, setDialogEditMode] = useState(false);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE];
  const active = marketStage === ACTIVE_STAGE;

  let sidebarMenuList = [
    {
      label: intl.formatMessage({ id: 'decisionDialogAddInvestibleLabel' }),
      icon: <AddIcon />,
      onClick: () => toggleInvestibleAddMode(),
    },
    {
      label: intl.formatMessage({ id: 'dialogAddParticipantsLabel' }),
      icon: <GroupAddIcon />,
      onClick: () => toggleAddParticipantsMode(),
    },
    {
      label: intl.formatMessage({ id: 'commentIconRaiseIssueLabel' }),
      icon: <ReportProblemIcon />,
      onClick: () => commentButtonOnClick(ISSUE_TYPE),
    },
    {
      label: intl.formatMessage({ id: 'commentIconAskQuestionLabel' }),
      icon: <ContactSupportIcon />,
      onClick: () => commentButtonOnClick(QUESTION_TYPE),
    },
  ];

  const adminMenuList = [
    {
      label: intl.formatMessage({ id: 'dialogEditButtonTooltip' }),
      icon: <EditIcon />,
      onClick: () => toggleEditMode(),
    },
  ];  

  function getInvestiblesForStage(stage) {
    if (stage) {
      return investibles.reduce((acc, inv) => {
        const { market_infos } = inv;
        for (let x = 0; x < market_infos.length; x += 1) {
          if (market_infos[x].stage === stage.id) {
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

  function toggleEditMode() {
    setDialogEditMode(!dialogEditMode);
  }

  function toggleInvestibleAddMode() {
    setAddInvestibleMode(!addInvestibleMode);
  }

  function toggleAddParticipantsMode() {
    setAddParticipantsMode(!addParticipantsMode);
  }

  function closeCommentAddBox() {
    setCommentAddHidden(true);
  }

  if (dialogEditMode) {
    return (
      <Screen
        title={marketName}
        hidden={hidden}
        tabTitle={marketName}
        breadCrumbs={breadCrumbs}
      >
        <DialogEdit
          editToggle={toggleEditMode}
          market={market}
          onCancel={toggleEditMode}
        />
      </Screen>
    );
  }

  if (addParticipantsMode) {
    const breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId) }];
    const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
    const participantsTitle = intl.formatMessage({ id: 'addressListHeader' });
    return (
      <Screen
        tabTitle={participantsTitle}
        title={participantsTitle}
        hidden={hidden}
        breadCrumbs={myBreadCrumbs}
      >
        <AddressList
          addToMarketId={marketId}
          onCancel={toggleAddParticipantsMode}
          onSave={toggleAddParticipantsMode}
          intl={intl}
        />
      </Screen>
    );
  }

  // if we're adding an investible, just render it with the screen
  if (addInvestibleMode) {
    const breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId) }];
    const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
    const newStory = intl.formatMessage({ id: 'newStory' });
    return (
      <Screen
        title={newStory}
        hidden={hidden}
        tabTitle={newStory}
        breadCrumbs={myBreadCrumbs}
      >
        <InvestibleAdd
          marketId={marketId}
          onCancel={toggleInvestibleAddMode}
          onSave={toggleInvestibleAddMode}
          isAdmin={isAdmin}
        />
      </Screen>
    );
  }

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
    scrollToCommentAddBox(commentAddRef);
  }

  function getSidebarActions() {
    if (addInvestibleMode || addParticipantsMode) {
      return [];
    }

    if (!active) {
      // eventually we'll have inactive actions here
      return [];
    }

    if (isAdmin) {
      sidebarMenuList.unshift(...adminMenuList);
    }
    
    const userActions = sidebarMenuList.map(item => (
      <SidebarMenuButton label={item.label} icon={item.icon} onClick={item.onClick} />
    ));
    
    return userActions;
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
      <Grid container spacing={2} >
        <Grid item xs={12} >
          <SubSection
            title={intl.formatMessage({ id: 'decisionDialogSummaryLabel' })}
          >
            <Summary market={market} />
          </SubSection>
        </Grid>
        <Grid item xs={12} >
          <SubSection
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

        <Grid item xs={12} >
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
        <Grid
          item
          xs={12}
        >
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogDiscussionLabel' })}
          >
            <CommentAddBox
              hidden={commentAddHidden}
              type={commentAddType}
              allowedTypes={allowedCommentTypes}
              marketId={marketId}
              onSave={closeCommentAddBox}
              onCancel={closeCommentAddBox}
            />
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
