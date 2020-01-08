/**
 * A component that renders a _decision_ dialog
 */
import React, { useRef, useState } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import { Grid } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import SmsOutlinedIcon from '@material-ui/icons/SmsOutlined';
import VisibilityIcon from '@material-ui/icons/Visibility';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import EditAttributesIcon from '@material-ui/icons/EditAttributes';
import {
  formMarketAddInvestibleLink,
  makeBreadCrumbs,
  navigate,
  formMarketEditLink, formMarketManageLink,
} from '../../../utils/marketIdPathFunctions';
import Summary from '../Summary';
import ProposedIdeas from './ProposedIdeas';
import SubSection from '../../../containers/SubSection/SubSection';
import CurrentVoting from './CurrentVoting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import Screen from '../../../containers/Screen/Screen';
import { scrollToCommentAddBox } from '../../../components/Comments/commentFunctions';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments';
import { SECTION_TYPE_SECONDARY } from '../../../constants/global';
import { changeToObserver, changeToParticipant } from '../../../api/markets';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';
import { getDialogTypeIcon } from '../../../components/Dialogs/dialogIconFunctions';
import { DECISION_TYPE } from '../../../constants/markets';

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
  } = market;

  const {
    is_admin: isAdmin,
    following,
    investments,
  } = myPresence;
  const underConsiderationStage = marketStages.find((stage) => stage.allows_investment);
  const proposedStage = marketStages.find((stage) => !stage.allows_investment);
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history);
  const investibleComments = comments.filter((comment) => comment.investible_id);
  const marketComments = comments.filter((comment) => !comment.investible_id);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE];

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

  const sidebarMenuList = [
    {
      label: intl.formatMessage({ id: addLabel }),
      icon: <AddIcon />,
      onClick: () => navigate(history, formMarketAddInvestibleLink(marketId)),
    },
    {
      label: intl.formatMessage({ id: 'dialogManageLabel' }),
      icon: <EditAttributesIcon />,
      onClick: () => toggleAddParticipantsMode(),
    },
    {
      label: intl.formatMessage({ id: 'commentIconRaiseIssueLabel' }),
      icon: <ErrorOutlineIcon />,
      onClick: () => commentButtonOnClick(ISSUE_TYPE),
    },
    {
      label: intl.formatMessage({ id: 'commentIconAskQuestionLabel' }),
      icon: <SmsOutlinedIcon />,
      onClick: () => commentButtonOnClick(QUESTION_TYPE),
    },
  ];
  const notVoted = _.isEmpty(investments);
  if (notVoted && !isAdmin) {
    if (following) {
      sidebarMenuList.push({
        label: intl.formatMessage({ id: 'decisionDialogsBecomeObserver' }),
        icon: <VisibilityIcon />,
        spinBlocking: true,
        onClick: () => changeToObserver(marketId),
      });
    } else {
      sidebarMenuList.push({
        label: intl.formatMessage({ id: 'decisionDialogsBecomeParticipant' }),
        icon: <ThumbsUpDownIcon />,
        spinBlocking: true,
        onClick: () => changeToParticipant(marketId),
      });
    }
  }

  const adminMenuList = [
    {
      label: intl.formatMessage({ id: 'dialogEditButtonTooltip' }),
      icon: <EditIcon />,
      onClick: () => navigate(history, formMarketEditLink(marketId)),
    },
  ];

  function getSidebarActions() {
    if (isAdmin) {
      sidebarMenuList.unshift(...adminMenuList);
    }

    return sidebarMenuList.map((item, index) => {
      const { onClick, label, icon } = item;
      if (item.spinBlocking) {
        return (
          <SpinBlockingSidebarAction
            key={index}
            label={label}
            onClick={onClick}
            icon={icon}
            marketId={marketId}
          />
        );
      }
      return <ExpandableSidebarAction key={index} label={label} icon={icon} onClick={onClick} />;
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
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SubSection
            title={intl.formatMessage({ id: 'decisionDialogSummaryLabel' })}
            titleIcon={getDialogTypeIcon(DECISION_TYPE)}
          >
            <Summary market={market} />
          </SubSection>
        </Grid>
        <Grid item xs={12} style={{ marginTop: '30px' }}>
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
