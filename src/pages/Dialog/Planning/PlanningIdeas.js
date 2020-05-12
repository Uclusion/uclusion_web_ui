import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { Link, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { red, yellow } from '@material-ui/core/colors'
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl'
import { formInvestibleLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions'
import clsx from 'clsx'

const warningColor = red["400"];

const usePlanningIdStyles = makeStyles(
  theme => {
    return {
      stages: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        margin: 0,
        "& > *": {
          borderRight: `1px solid ${theme.palette.grey["300"]}`,
          flex: "1 1 25%",
          minWidth: "15ch",
          padding: theme.spacing(1),
          "&:last-child": {
            borderRight: "none"
          }
        }
      },
      stageLabel: {}
    };
  },
  { name: "PlanningIdea" }
);

function PlanningIdeas(props) {
  const {
    investibles,
    marketId,
    acceptedStageId,
    inDialogStageId,
    inReviewStageId,
    inBlockingStageId,
    presenceId,
    warnAccepted,
    activeMarket,
  } = props;

  const classes = usePlanningIdStyles();

  return (
    <dl className={classes.stages}>
      <div>
        <dt className={classes.stageLabel}>
          <FormattedMessage id="planningVotingStageLabel" />
        </dt>
        <VotingStage
          className={classes.stage}
          id={inDialogStageId}
          investibles={investibles}
          marketId={marketId}
          presenceId={presenceId}
          activeMarket={activeMarket}
        />
      </div>
      <div>
        <dt className={classes.stageLabel}>
          <FormattedMessage id="planningAcceptedStageLabel" />
        </dt>
        <AcceptedStage
          className={classes.stage}
          id={acceptedStageId}
          investibles={investibles}
          marketId={marketId}
          warnAccepted={warnAccepted}
        />
      </div>
      <div>
        <dt className={classes.stageLabel}>
          <FormattedMessage id="planningReviewStageLabel" />
        </dt>
        <ReviewStage
          className={classes.stage}
          id={inReviewStageId}
          investibles={investibles}
          marketId={marketId}
        />
      </div>
      <div>
        <dt className={classes.stageLabel}>
          <FormattedMessage id="planningBlockedStageLabel" />
        </dt>
        <BlockingStage
          className={classes.stage}
          id={inBlockingStageId}
          investibles={investibles}
          marketId={marketId}
        />
      </div>
    </dl>
  );
}

PlanningIdeas.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  acceptedStageId: PropTypes.string.isRequired,
  inDialogStageId: PropTypes.string.isRequired,
  inReviewStageId: PropTypes.string.isRequired,
  inBlockingStageId: PropTypes.string.isRequired,
  presenceId: PropTypes.string.isRequired
};

PlanningIdeas.defaultProps = {
  investibles: [],
  comments: []
};

const useStageClasses = makeStyles(
  theme => {
    return {
      root: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        fontSize: ".8em",
        margin: theme.spacing(1, 0),
        padding: theme.spacing(1, 2)
      },
      rootWarnAccepted: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        fontSize: ".8em",
        margin: theme.spacing(1, 0),
        padding: theme.spacing(1, 2),
        backgroundColor: yellow["400"],
      },
      fallback: {
        backgroundColor: theme.palette.grey["400"]
      },
      list: {
        listStyle: "none",
        margin: 0,
        padding: 0
      }
    };
  },
  { name: "Stage" }
);

function Stage(props) {
  const {
    comments,
    fallbackWarning,
    id,
    investibles,
    marketId,
    updatedText,
    warnAccepted,
  } = props;

  // // console.log(comments);
  const stageInvestibles = investibles.filter(investible => {
    const { market_infos: marketInfos } = investible;
    // // console.log(`Investible id is ${id}`);
    const marketInfo = marketInfos.find(info => info.market_id === marketId);
    if (process.env.NODE_ENV !== "production") {
      if (marketInfo === undefined) {
        console.warn(`no marketinfo for ${marketId} with `, marketInfos);
      }
    }
    return marketInfo !== undefined && marketInfo.stage === id;
  });

  const classes = useStageClasses(props);

  if (fallbackWarning !== undefined && stageInvestibles.length === 0) {
    return (
      <dd className={clsx(classes.root, classes.fallback)}>
        {fallbackWarning}
      </dd>
    );
  }

  return (
    <dd className={warnAccepted ? classes.rootWarnAccepted : classes.root}>
      <ul className={classes.list}>
        {stageInvestibles.map(inv => {
          const { investible, market_infos: marketInfos } = inv;
          const marketInfo = marketInfos.find(
            info => info.market_id === marketId
          );

          return (
            <li key={investible.id}>
              <StageInvestible
                comments={comments}
                investible={investible}
                marketId={marketId}
                marketInfo={marketInfo}
                updatedText={updatedText}
              />
            </li>
          );
        })}
      </ul>
    </dd>
  );
}

Stage.propTypes = {
  id: PropTypes.string.isRequired,
  investibles: PropTypes.array.isRequired,
  marketId: PropTypes.string.isRequired
};

const useVotingStageClasses = makeStyles(
  theme => {
    return {
      root: {},
      fallback: {
        backgroundColor: warningColor,
        color: "white"
      }
    };
  },
  { name: "VotingStage" }
);

function VotingStage(props) {
  const { className, marketId, presenceId, activeMarket, ...other } = props;

  const classes = useVotingStageClasses();
  const intl = useIntl();

  const history = useHistory();
  const link = formMarketAddInvestibleLink(marketId);
  const assignedLink = link + `#assignee=${presenceId}`;
  function onClick(event) {
    // prevent browser navigation
    event.preventDefault();
    navigate(history, assignedLink);
  }

  return (
    <Stage
      classes={classes}
      fallbackWarning={
        activeMarket ?
        <React.Fragment>
          <FormattedMessage id="planningNoneInDialogWarning" />
          <StageLink href={assignedLink} onClick={onClick}>
            {intl.formatMessage({
              id: "createAssignment"
            })}
          </StageLink>
        </React.Fragment> : <React.Fragment>
            <FormattedMessage id="planningNoneInDialogWarning" />
          </React.Fragment>
      }
      marketId={marketId}
      updatedText={intl.formatMessage({
        id: "inDialogInvestiblesUpdatedAt"
      })}
      {...other}
   />
  );
}

function AcceptedStage(props) {
  const intl = useIntl();

  return (
    <Stage
      fallbackWarning={<FormattedMessage id="planningNoneAcceptedWarning" />}
      updatedText={intl.formatMessage({
        id: "acceptedInvestiblesUpdatedAt"
      })}
      {...props}
    />
  );
}

function ReviewStage(props) {
  const intl = useIntl();

  return (
    <Stage
      fallbackWarning={intl.formatMessage({
        id: "planningNoneInReviewWarning"
      })}
      updatedText={intl.formatMessage({
        id: "reviewingInvestiblesUpdatedAt"
      })}
      {...props}
    />
  );
}

const useBlockingStageStyles = makeStyles(theme => {
  return {
    root: {
      backgroundColor: warningColor
    },
    fallback: {
      backgroundColor: theme.palette.grey["400"]
    }
  };
});

function BlockingStage(props) {
  const intl = useIntl();
  const classes = useBlockingStageStyles();

  return (
    <Stage
      classes={classes}
      fallbackWarning={intl.formatMessage({
        id: "planningNoneInBlockingWarning"
      })}
      updatedText={intl.formatMessage({
        id: "blockedInvestiblesUpdatedAt"
      })}
      {...props}
    />
  );
}

function StageInvestible(props) {
  const { investible, marketId, marketInfo, updatedText } = props;

  const { id, name } = investible;

  const history = useHistory();
  const to = formInvestibleLink(marketId, id);

  return (
    <StageLink
      href={to}
      onClick={event => {
        event.preventDefault();
        navigate(history, to);
      }}
    >
      <Typography variant="subtitle2">{name}</Typography>
      <Typography variant="inherit">
        {updatedText}
        <FormattedDate value={marketInfo.updated_at} />
      </Typography>
    </StageLink>
  );
}

const useStageLinkStyles = makeStyles(theme => {
  return {
    root: {
      color: "inherit",
      display: "block",
      height: "100%",
      width: "100%"
    }
  };
});

function StageLink(props) {
  const { className, ...other } = props;
  const classes = useStageLinkStyles();
  return <Link className={clsx(classes.root, className)} {...other} />;
}

export default PlanningIdeas;
