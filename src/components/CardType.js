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

export { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE };
export const VOTING_TYPE = "VOTING";

const useCardTypeStyles = makeStyles(
  {
    root: ({ type }) => {
      return {
        backgroundColor: {
          [ISSUE_TYPE]: "#E85757",
          [QUESTION_TYPE]: "#2F80ED",
          [SUGGEST_CHANGE_TYPE]: "#F29100",
          [VOTING_TYPE]: "#9B51E0"
        }[type],
        borderBottomRightRadius: 8,
        color: "white",
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

export default function CardType(props) {
  const { className, type } = props;
  const classes = useCardTypeStyles({ type });

  const IconComponent = {
    [ISSUE_TYPE]: IssueIcon,
    [QUESTION_TYPE]: QuestionIcon,
    [SUGGEST_CHANGE_TYPE]: ChangeSuggstionIcon,
    [VOTING_TYPE]: VotingIcon
  }[type];

  const labelIntlId = {
    [ISSUE_TYPE]: "cardTypeLabelIssue",
    [QUESTION_TYPE]: "cardTypeLabelQuestion",
    [SUGGEST_CHANGE_TYPE]: "cardTypeLabelSuggestedChange",
    [VOTING_TYPE]: "cardTypeVoting"
  }[type];

  return (
    <div className={clsx(classes.root, className)}>
      <IconComponent className={classes.icon} />
      <span className={classes.label}>
        <FormattedMessage id={labelIntlId} />
      </span>
    </div>
  );
}
CardType.propTypes = {
  type: PropTypes.oneOf([
    ISSUE_TYPE,
    QUESTION_TYPE,
    SUGGEST_CHANGE_TYPE,
    VOTING_TYPE
  ])
};
