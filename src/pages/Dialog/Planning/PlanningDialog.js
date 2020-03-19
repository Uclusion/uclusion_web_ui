/**
 * A component that renders a _planning_ dialog
 */
import React, { useContext } from "react";
import { useHistory } from "react-router";
import { useIntl } from "react-intl";
import PropTypes from "prop-types";
import _ from "lodash";
import { Typography } from "@material-ui/core";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import { makeStyles } from "@material-ui/core/styles";
import Summary from "./Summary";
import PlanningIdeas from "./PlanningIdeas";
import Screen from "../../../containers/Screen/Screen";
import {
  formMarketAddInvestibleLink,
  formMarketManageLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate
} from "../../../utils/marketIdPathFunctions";
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  SUGGEST_CHANGE_TYPE
} from "../../../constants/comments";
import CommentAddBox from "../../../containers/CommentBox/CommentAddBox";
import CommentBox from "../../../containers/CommentBox/CommentBox";
import ViewArchiveActionButton from "./ViewArchivesActionButton";
import { ACTIVE_STAGE, DECISION_TYPE } from "../../../constants/markets";
import ManageParticipantsActionButton from "./ManageParticipantsActionButton";
import { getUserInvestibles } from "./userUtils";
import { MarketPresencesContext } from "../../../contexts/MarketPresencesContext/MarketPresencesContext";
import ExpandableSidebarAction from "../../../components/SidebarActions/ExpandableSidebarAction";
import InsertLinkIcon from "@material-ui/icons/InsertLink";
import { getMarketPresences } from "../../../contexts/MarketPresencesContext/marketPresencesHelper";
import InvestibleAddActionButton from "./InvestibleAddActionButton";

function PlanningDialog(props) {
  const history = useHistory();
  const {
    market,
    investibles,
    marketPresences,
    marketStages,
    comments,
    hidden,
    myPresence
  } = props;
  const breadCrumbs =
    myPresence && myPresence.market_hidden
      ? makeArchiveBreadCrumbs(history)
      : makeBreadCrumbs(history);

  const intl = useIntl();
  const { id: marketId, market_stage: marketStage } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const marketComments = comments.filter(comment => !comment.investible_id);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const { name: marketName, locked_by: lockedBy } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId);
  const acceptedStage = marketStages.find(
    stage => !stage.allows_investment && stage.singular_only
  ) || {};
  const inDialogStage = marketStages.find(stage => stage.allows_investment) || {};
  const inReviewStage = marketStages.find(
    stage =>
      stage.appears_in_context && !stage.singular_only && !stage.allows_issues
  ) || {};
  const inBlockingStage = marketStages.find(
    stage => stage.appears_in_context && stage.allows_issues
  ) || {};
  const visibleStages = [
    inDialogStage.id,
    acceptedStage.id,
    inReviewStage.id,
    inBlockingStage.id
  ];
  const assignedPresences = presences.filter(presence => {
    const assignedInvestibles = getUserInvestibles(
      presence.id,
      marketId,
      investibles,
      visibleStages
    );
    return !_.isEmpty(assignedInvestibles);
  });
  const isChannel = _.isEmpty(assignedPresences);
  const unassigned = _.difference(presences, assignedPresences);

  let lockedByName;
  if (lockedBy) {
    const lockedByPresence = marketPresences.find(
      presence => presence.id === lockedBy
    );
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }

  function toggleManageUsersMode() {
    navigate(history, formMarketManageLink(marketId));
  }

  function getSidebarActions() {
    if (!activeMarket) {
      return [
        <ManageParticipantsActionButton
          key="addParticipants"
          onClick={toggleManageUsersMode}
        />,
        <ViewArchiveActionButton key="archives" marketId={marketId} />
      ];
    }
    function onClick() {
      const link = formMarketAddInvestibleLink(marketId);
      navigate(history, link);
    }
    return [
      <InvestibleAddActionButton key="investibleadd" onClick={onClick} />,
      <ManageParticipantsActionButton
        key="addParticipants"
        onClick={toggleManageUsersMode}
      />,
      <ViewArchiveActionButton key="archives" marketId={marketId} />,
      <ExpandableSidebarAction
        id="link"
        key="link"
        icon={<InsertLinkIcon />}
        label={intl.formatMessage({ id: "planningInvestibleDecision" })}
        onClick={() =>
          navigate(history, `/dialogAdd#type=${DECISION_TYPE}&id=${marketId}`)
        }
      />
    ];
  }

  const sidebarActions = getSidebarActions();
  return (
    <Screen
      title={marketName}
      hidden={hidden}
      tabTitle={marketName}
      breadCrumbs={breadCrumbs}
      sidebarActions={sidebarActions}
    >
      <Summary market={market} hidden={hidden} unassigned={unassigned} isChannel={isChannel} />
      {lockedBy && (
        <Typography>
          {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
        </Typography>
      )}
      {!isChannel && (
        <InvestiblesByPerson
          comments={comments}
          investibles={investibles}
          marketId={marketId}
          marketPresences={assignedPresences}
          visibleStages={visibleStages}
          acceptedStage={acceptedStage}
          inDialogStage={inDialogStage}
          inBlockingStage={inBlockingStage}
          inReviewStage={inReviewStage}
        />
      )}
      {activeMarket && (
        <CommentAddBox
          allowedTypes={allowedCommentTypes}
          marketId={marketId}
        />
      )}
      <CommentBox comments={marketComments} marketId={marketId} />
    </Screen>
  );
}

PlanningDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketStages: PropTypes.arrayOf(PropTypes.object),
  hidden: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  myPresence: PropTypes.object.isRequired
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
  hidden: false,
  comments: []
};

const useInvestiblesByPersonStyles = makeStyles(
  theme => {
    return {
      root: {
        margin: theme.spacing(1, 0)
      },
      content: {
        padding: theme.spacing(0, 1),
        "&:last-child": {
          paddingBottom: "inherit"
        }
      },
      header: {
        backgroundColor: theme.palette.grey["300"],
        padding: theme.spacing(1)
      }
    };
  },
  { name: "InvestiblesByPerson" }
);

function InvestiblesByPerson(props) {
  const {
    comments,
    investibles,
    marketId,
    marketPresences,
    visibleStages,
    acceptedStage,
    inDialogStage,
    inBlockingStage,
    inReviewStage,
  } = props;

  const classes = useInvestiblesByPersonStyles();

  return marketPresences.map(presence => {
    const myInvestibles = getUserInvestibles(
      presence.id,
      marketId,
      investibles,
      visibleStages,
    );
    const { id, name } = presence;
    return (
      <Card key={id} className={classes.root}>
        {/* TODO avatar */}
        <CardHeader
          className={classes.header}
          id={`u${id}`}
          title={name}
          titleTypographyProps={{ variant: "subtitle2" }}
        />
        <CardContent className={classes.content}>
          {marketId &&
            acceptedStage &&
            inDialogStage &&
            inReviewStage &&
            inBlockingStage && (
              <PlanningIdeas
                investibles={myInvestibles}
                marketId={marketId}
                acceptedStageId={acceptedStage.id}
                inDialogStageId={inDialogStage.id}
                inReviewStageId={inReviewStage.id}
                inBlockingStageId={inBlockingStage.id}
                comments={comments}
                presenceId={presence.id}
              />
            )}
        </CardContent>
      </Card>
    );
  });
}

export default PlanningDialog;
