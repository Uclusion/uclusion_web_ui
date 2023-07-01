import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { FormattedMessage, useIntl } from 'react-intl'
import { makeStyles } from '@material-ui/styles'
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../constants/comments'
// TODO create centralized icons repository
import IssueIcon from '@material-ui/icons/ReportProblem'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import ListAltIcon from '@material-ui/icons/ListAlt'
import VotingIcon from '@material-ui/icons/Assessment'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import GavelIcon from '@material-ui/icons/Gavel'
import PlayForWorkIcon from '@material-ui/icons/PlayForWork'
import RateReviewIcon from '@material-ui/icons/RateReview'
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
import UpdateIcon from '@material-ui/icons/Update'
import RemoveFromQueueIcon from '@material-ui/icons/RemoveFromQueue';
import UsefulRelativeTime from './TextFields/UseRelativeTime'
import { Typography, useMediaQuery, useTheme } from '@material-ui/core'
import { Block, BugReport } from '@material-ui/icons';
import { DaysEstimate } from './AgilePlan/DaysEstimate';

export { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE, DECISION_TYPE }
export const VOTING_TYPE = 'VOTING'
export const STORY_TYPE = 'STORY'
export const AGILE_PLAN_TYPE = 'AGILE_PLAN'
export const IN_PROGRESS = 'PROGRESS'
export const IN_REVIEW = 'REVIEW'
export const IN_BLOCKED = 'BLOCKED'
export const NOT_DOING = 'STOPPED'
export const FURTHER_WORK = 'FURTHER_WORK'
export const REQUIRES_INPUT = "REQUIRES_INPUT";
export const IN_VERIFIED = "VERIFIED";
export const OPTION = "OPTION";
export const PROPOSED = "PROPOSED";
export const BUG = 'BUG';
export const IN_VOTING= "DELIBERATION";
export const ASSIGN_TYPE = "ASSIGN";
export const GENERIC_STORY_TYPE = "GENERIC_STORY"; /// used in search results only

function NoIcon() {
  return null;
}

const useCardTypeStyles = makeStyles(theme => ({
    root: ({ type, resolved, color }) => {
      const grey = '#BDC3C7';
      const useColor = color === 'RED' ? '#E85757' :
        (color === 'YELLOW' ? '#e6e969' : (color === 'BLUE' ? '#2F80ED' : undefined));
      return {
        backgroundColor: {
          [ISSUE_TYPE]: resolved ? grey : '#E85757',
          [QUESTION_TYPE]: resolved ? grey : '#2F80ED',
          [SUGGEST_CHANGE_TYPE]: resolved ? grey : '#e6e969',
          [TODO_TYPE]:  resolved ? grey : (color ? useColor :'#F29100'),
          [REPORT_TYPE]: resolved? grey : '#73B76C',
          [VOTING_TYPE]: '#9B51E0',
          [JUSTIFY_TYPE]: '#9B51E0',
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
        color: {
            [ISSUE_TYPE]: 'white',
            [QUESTION_TYPE]: 'white',
            [SUGGEST_CHANGE_TYPE]: resolved ? 'white' : 'black',
            [TODO_TYPE]: useColor === '#e6e969' ? 'black' : 'white',
            [REPORT_TYPE]: 'white',
            [VOTING_TYPE]: 'white',
            [JUSTIFY_TYPE]: 'white',
            [STORY_TYPE]: 'white',
            [GENERIC_STORY_TYPE]: 'white',
            [DECISION_TYPE]: 'white',
            certainty5: 'white',
            certainty25: 'black',
            certainty50: 'black',
            certainty75: 'black',
            certainty100: 'black',
            [AGILE_PLAN_TYPE]: 'white'
          }[type],
        padding: `4px 8px`,
        whiteSpace: 'nowrap'
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
      textTransform: 'capitalize'
    },
    labelGrid: {
      display: 'flex',
      maxWidth: 'unset',
      flexBasis: 'unset'
    },
    lastEdited: {
      paddingTop: '2px',
      fontWeight: 900,
      [theme.breakpoints.down('sm')]: {
        fontSize: '.7rem',
        lineHeight: 1,
        paddingLeft: '5px'
      },
    },
    timeElapsed: {
      paddingTop: '2px',
      whiteSpace: 'nowrap',
      [theme.breakpoints.down('sm')]: {
        fontSize: '.7rem',
        lineHeight: 1,
        paddingLeft: '5px'
      },
    }
  }),
  { name: 'CardType' }
);

const labelIntlIds = {
  [ISSUE_TYPE]: "cardTypeLabelIssue",
  [QUESTION_TYPE]: "cardTypeLabelQuestion",
  [SUGGEST_CHANGE_TYPE]: "cardTypeLabelSuggestedChange",
  [TODO_TYPE]: "cardTypeLabelTodo",
  [REPORT_TYPE]: "cardTypeLabelProgressReport",
  certainty5: "certainty5",
  certainty25: "certainty25",
  certainty50: "certainty50",
  certainty75: "certainty75",
  certainty100: "certainty100"
};

export default function CardType(props) {
  const {
    className,
    marketId,
    gravatar,
    type,
    resolved,
    subtype,
    label = type in labelIntlIds ? <FormattedMessage id={labelIntlIds[type]}/> : undefined,
    createdAt,
    myBeingEdited,
    stageChangedAt,
    marketDaysEstimate,
    onEstimateChange,
    isInAccepted,
    color,
    compact = false,
    isAssigned
  } = props;
  const classes = useCardTypeStyles({ type, resolved, color });
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const IconComponent = {
    [ISSUE_TYPE]: Block,
    [QUESTION_TYPE]: QuestionIcon,
    [SUGGEST_CHANGE_TYPE]: ChangeSuggstionIcon,
    [TODO_TYPE]: ListAltIcon,
    [BUG]: BugReport,
    [REPORT_TYPE]: UpdateIcon,
    [VOTING_TYPE]: VotingIcon,
    [STORY_TYPE]: EditIcon,
    [JUSTIFY_TYPE]: HowToVoteIcon,
    [IN_VOTING]: ThumbsUpDownIcon,
    [IN_PROGRESS]: PlayForWorkIcon,
    [IN_REVIEW]: RateReviewIcon,
    [IN_BLOCKED]: Block,
    [NOT_DOING]: NotInterestedIcon,
    [IN_VERIFIED]: VerifiedUserIcon,
    [FURTHER_WORK]: WorkIcon,
    [REQUIRES_INPUT]: GavelIcon,
    [OPTION]: StarRateIcon,
    [PROPOSED]: RemoveFromQueueIcon,
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
    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
      width: compact ? '40%' : '100%', maxWidth: compact ? '25rem' : undefined}}>
      {(label || gravatar) && (
        <>
          {label && (
            <div className={clsx(classes.root, className)} style={{marginRight: mobileLayout ? '0.25rem' : '1rem'}}>
              <IconComponent className={classes.icon}/>
              <span className={classes.label}>{label}</span>
            </div>
          )}
          {gravatar}
        </>
      )}
      {myBeingEdited && (
        <Typography className={classes.lastEdited} variant="body2">
          {intl.formatMessage({ id: 'edited' })}
        </Typography>
      )}
      {isInAccepted && (
        <DaysEstimate marketId={marketId} onChange={onEstimateChange} value={marketDaysEstimate}
                      isAssigned={isAssigned} />
      )}
      {createdAt && (
        <Typography className={classes.timeElapsed} variant="body2">
          {intl.formatMessage({ id: 'created' })} <UsefulRelativeTime value={createdAt}/>
        </Typography>
      )}
      {stageChangedAt && (
        <Typography className={classes.timeElapsed} variant="body2">
          {intl.formatMessage({ id: 'stageUpdatedAt' })} <UsefulRelativeTime value={stageChangedAt}/>
        </Typography>
      )}
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
    REQUIRES_INPUT,
    NOT_DOING,
    ASSIGN_TYPE,
    OPTION,
    PROPOSED,
    BUG
  ]),
  type: PropTypes.oneOf([
    "certainty5",
    "certainty25",
    "certainty50",
    "certainty75",
    "certainty100",
    JUSTIFY_TYPE,
    ISSUE_TYPE,
    QUESTION_TYPE,
    SUGGEST_CHANGE_TYPE,
    TODO_TYPE,
    REPORT_TYPE,
    VOTING_TYPE,
    STORY_TYPE,
    DECISION_TYPE,
    GENERIC_STORY_TYPE,
    AGILE_PLAN_TYPE
  ])
};
