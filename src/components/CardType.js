import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { FormattedMessage } from "react-intl";
import { makeStyles } from "@material-ui/styles";
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  SUGGEST_CHANGE_TYPE
} from "../constants/comments";
// TODO create centralized icons repository
import IssueIcon from "@material-ui/icons/ReportProblem";
import QuestionIcon from "@material-ui/icons/ContactSupport";
import ChangeSuggstionIcon from "@material-ui/icons/ChangeHistory";
import VotingIcon from "@material-ui/icons/Assessment";
import GavelIcon from '@material-ui/icons/Gavel';
import { DECISION_TYPE } from '../constants/markets';
import AgilePlanIcon from "@material-ui/icons/PlaylistAdd";

export { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, DECISION_TYPE };
export const VOTING_TYPE = "VOTING";
export const AGILE_PLAN_TYPE = "AGILE_PLAN";

function NoIcon() {
  return null;
}

const useCardTypeStyles = makeStyles(
  {
    root: ({ type }) => {
      return {
        backgroundColor: {
          [ISSUE_TYPE]: "#E85757",
          [QUESTION_TYPE]: "#2F80ED",
          [SUGGEST_CHANGE_TYPE]: "#F29100",
          [VOTING_TYPE]: "#9B51E0",
          [DECISION_TYPE]: "#0B51E0",
          certainty0: "#D54F22",
          certainty25: "#F4AB3B",
          certainty50: "#FCEC69",
          certainty75: "#A5C86B",
          certainty100: "#73B76C",
          [AGILE_PLAN_TYPE]: "#9B51E0"
        }[type],
        borderBottomRightRadius: 8,
        color:
          ["certainty25", "certainty50", "certainty75", "certainty100"].indexOf(
            type
          ) === -1
            ? "white"
            : "black",
        padding: `4px 8px`
      };
    },
    icon: {
      marginRight: 6,
      height: 16,
      width: 16
    },
    label: {
      fontSize: 14,
      lineHeight: 1,
      textTransform: "capitalize"
    }
  },
  { name: "CardType" }
);

const labelIntlIds = {
  [ISSUE_TYPE]: "cardTypeLabelIssue",
  [QUESTION_TYPE]: "cardTypeLabelQuestion",
  [SUGGEST_CHANGE_TYPE]: "cardTypeLabelSuggestedChange",
  certainty0: "certainty0",
  certainty25: "certainty25",
  certainty50: "certainty50",
  certainty75: "certainty75",
  certainty100: "certainty100"
};

export default function CardType(props) {
  const {
    className,
    type,
    label = <FormattedMessage id={labelIntlIds[type]} />
  } = props;
  const classes = useCardTypeStyles({ type });

  const IconComponent = {
    [ISSUE_TYPE]: IssueIcon,
    [QUESTION_TYPE]: QuestionIcon,
    [SUGGEST_CHANGE_TYPE]: ChangeSuggstionIcon,
    [VOTING_TYPE]: VotingIcon,
    [DECISION_TYPE]: GavelIcon,
    certainty0: NoIcon,
    certainty25: NoIcon,
    certainty50: NoIcon,
    certainty75: NoIcon,
    certainty100: NoIcon,
    [AGILE_PLAN_TYPE]: AgilePlanIcon
  }[type];

  return (
    <div className={clsx(classes.root, className)}>
      <IconComponent className={classes.icon} />
      <span className={classes.label}>{label}</span>
    </div>
  );
}
CardType.propTypes = {
  label: PropTypes.node,
  type: PropTypes.oneOf([
    "certainty0",
    "certainty25",
    "certainty50",
    "certainty75",
    "certainty100",
    ISSUE_TYPE,
    QUESTION_TYPE,
    SUGGEST_CHANGE_TYPE,
    VOTING_TYPE,
    DECISION_TYPE,
    AGILE_PLAN_TYPE
  ])
};
