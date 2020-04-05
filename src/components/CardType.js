import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { FormattedMessage } from 'react-intl'
import { makeStyles } from '@material-ui/styles'
import { ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../constants/comments'
// TODO create centralized icons repository
import IssueIcon from '@material-ui/icons/ReportProblem'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import VotingIcon from '@material-ui/icons/Assessment'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import GavelIcon from '@material-ui/icons/Gavel'
import PlayForWorkIcon from '@material-ui/icons/PlayForWork'
import RateReviewIcon from '@material-ui/icons/RateReview'
import BlockIcon from '@material-ui/icons/Block'
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser'
import WorkIcon from '@material-ui/icons/Work'
import NotInterestedIcon from '@material-ui/icons/NotInterested'
import StarRateIcon from '@material-ui/icons/StarRate'
import EditIcon from '@material-ui/icons/Edit'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import { DECISION_TYPE } from '../constants/markets'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import AssignmentIcon from '@material-ui/icons/Assignment'
import HowToVoteIcon from '@material-ui/icons/HowToVote'

export { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, DECISION_TYPE };
export const VOTING_TYPE = "VOTING";
export const STORY_TYPE = "STORY";
export const AGILE_PLAN_TYPE = "AGILE_PLAN";
export const IN_PROGRESS = "PROGRESS";
export const IN_REVIEW = "REVIEW";
export const IN_BLOCKED = "BLOCKED";
export const NOT_DOING = "STOPPED";
export const FURTHER_WORK = "FURTHER_WORK";
export const IN_VERIFIED = "VERIFIED";
export const OPTION = "OPTION";
export const IN_VOTING= "DELIBERATION";
export const ASSIGN_TYPE = "ASSIGN";
export const GENERIC_STORY_TYPE = "GENERIC_STORY"; /// used in search results only

function NoIcon() {
  return null;
}

const useCardTypeStyles = makeStyles(
  {
    root: ({ type, resolved }) => {
      return {
        backgroundColor: {
          [ISSUE_TYPE]: resolved ? "#BDC3C7" : "#E85757",
          [QUESTION_TYPE]: resolved ? "#BDC3C7" : "#2F80ED",
          [SUGGEST_CHANGE_TYPE]: resolved ? "#BDC3C7" : "#F29100",
          [VOTING_TYPE]: "#9B51E0",
          [JUSTIFY_TYPE]: "#9B51E0",
          [STORY_TYPE]: "#506999",
          [GENERIC_STORY_TYPE]: "#506999",
          [DECISION_TYPE]: "#0B51E0",
          certainty5: "#D54F22",
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
      fontWeight: 500,
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
  certainty5: "certainty5",
  certainty25: "certainty25",
  certainty50: "certainty50",
  certainty75: "certainty75",
  certainty100: "certainty100",
  [AGILE_PLAN_TYPE]: "cardTypeAgilePlan",
  [DECISION_TYPE]: "dialogDescription"
};

export default function CardType(props) {
  const {
    className,
    type,
    resolved,
    subtype,
    label = <FormattedMessage id={labelIntlIds[type]} />
  } = props;
  const classes = useCardTypeStyles({ type, resolved });

  const IconComponent = {
    [ISSUE_TYPE]: IssueIcon,
    [QUESTION_TYPE]: QuestionIcon,
    [SUGGEST_CHANGE_TYPE]: ChangeSuggstionIcon,
    [VOTING_TYPE]: VotingIcon,
    [STORY_TYPE]: EditIcon,
    [JUSTIFY_TYPE]: HowToVoteIcon,
    [IN_VOTING]: ThumbsUpDownIcon,
    [IN_PROGRESS]: PlayForWorkIcon,
    [IN_REVIEW]: RateReviewIcon,
    [IN_BLOCKED]: BlockIcon,
    [NOT_DOING]: NotInterestedIcon,
    [IN_VERIFIED]: VerifiedUserIcon,
    [FURTHER_WORK]: WorkIcon,
    [OPTION]: StarRateIcon,
    [ASSIGN_TYPE]: PersonAddIcon,
    [DECISION_TYPE]: GavelIcon,
    certainty5: NoIcon,
    certainty25: NoIcon,
    certainty50: NoIcon,
    certainty75: NoIcon,
    certainty100: NoIcon,
    [AGILE_PLAN_TYPE]: AgilePlanIcon,
    [GENERIC_STORY_TYPE]: AssignmentIcon,
  }[subtype || type];

  return (
    <div className={clsx(classes.root, className)}>
      <IconComponent className={classes.icon} />
      <span className={classes.label}>{label}</span>
    </div>
  );
}
CardType.propTypes = {
  label: PropTypes.node,
  subtype: PropTypes.oneOf([
    IN_VOTING,
    IN_VERIFIED,
    IN_BLOCKED,
    IN_REVIEW,
    STORY_TYPE,
    IN_PROGRESS,
    FURTHER_WORK,
    NOT_DOING,
    ASSIGN_TYPE,
    OPTION
  ]),
  type: PropTypes.oneOf([
    "certainty5",
    "certainty25",
    "certainty50",
    "certainty75",
    "certainty100",
    ISSUE_TYPE,
    QUESTION_TYPE,
    SUGGEST_CHANGE_TYPE,
    VOTING_TYPE,
    STORY_TYPE,
    DECISION_TYPE,
    GENERIC_STORY_TYPE,
    AGILE_PLAN_TYPE
  ])
};
