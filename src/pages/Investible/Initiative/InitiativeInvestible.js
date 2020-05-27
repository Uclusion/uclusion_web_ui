import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { FormattedMessage, useIntl } from 'react-intl'
import _ from 'lodash'
import { Card, CardContent, Grid, makeStyles, Typography } from '@material-ui/core'
import YourVoting from '../Voting/YourVoting'
import Voting from '../Decision/Voting'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, } from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import Screen from '../../../containers/Screen/Screen'
import { makeArchiveBreadCrumbs, makeBreadCrumbs, navigate, } from '../../../utils/marketIdPathFunctions'
import { ACTIVE_STAGE, PLANNING_TYPE } from '../../../constants/markets'
import InsertLinkIcon from '@material-ui/icons/InsertLink'
import MarketLinks from '../../Dialog/MarketLinks'
import CardType, { VOTING_TYPE } from '../../../components/CardType'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import ExpiredDisplay from '../../../components/Expiration/ExpiredDisplay'
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay'
import clsx from 'clsx'
import { useMetaDataStyles } from '../Planning/PlanningInvestible'
import DialogActions from '../../Home/DialogActions'
import Collaborators from '../../Dialog/Collaborators'
import CardActions from '@material-ui/core/CardActions'
import DismissableText from '../../../components/Notifications/DismissableText'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import { TourContext } from '../../../contexts/TourContext/TourContext';
import { startTourFamily } from '../../../contexts/TourContext/tourContextReducer';
import {
  INVITE_INITIATIVE_FAMILY_NAME,
  INVITE_INITIATIVE_FIRST_VIEW, inviteInitiativeSteps
} from '../../../components/Tours/InviteTours/initiative';
import UclusionTour from '../../../components/Tours/UclusionTour';
import { CognitoUserContext } from '../../../contexts/CongitoUserContext';

const useStyles = makeStyles(
  theme => ({
    root: {
      alignItems: "flex-start",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between"
    },
    cardType: {
      display: "inline-flex"
    },
    mobileColumn: {
      [theme.breakpoints.down("xs")]: {
        flexDirection: 'column'
      }
    },
    borderLeft: {
      borderLeft: '1px solid #e0e0e0',
      padding: '2rem',
      marginBottom: '-42px',
      marginTop: '-42px',
      [theme.breakpoints.down("xs")]: {
        padding: '1rem 0',
        marginTop: '1rem',
        borderLeft: 'none',
        borderTop: '1px solid #e0e0e0',
        flexGrow: 'unset',
        maxWidth: 'unset',
        flexBasis: 'auto'
      }
    },
    actions: {
      justifyContent: 'flex-end',
      '& > button': {
        marginRight: '-8px'
      },
      [theme.breakpoints.down('sm')]: {
        justifyContent: 'center',
      }
    },
    content: {
      flexBasis: "100%",
      padding: theme.spacing(4)
    },
    assignments: {
      padding: 0,
      "& ul": {
        flex: 4,
        margin: 0,
        padding: 0,
        flexDirection: 'row',
      },
      "& li": {
        display: "inline-block",
        fontWeight: "bold",
        marginLeft: theme.spacing(1)
      }
    },
    group: {
      backgroundColor: '#ecf0f1',
      borderRadius: 6,
      display: "flex",
      flexDirection: "row",
      padding: theme.spacing(1, 1),
      "&:first-child": {
        marginLeft: 0
      }
    },
    assignmentContainer: {
      width: '100%',
      textTransform: 'capitalize'
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      lineHeight: "42px",
      paddingBottom: "9px",
      [theme.breakpoints.down("xs")]: {
        fontSize: 25
      }
    },
    flexCenter: {
      [theme.breakpoints.down("xs")]: {
        alignItems: 'center',
        padding: '20px'
      }
    }
  }),
  { name: "InitiativeInvestible" }
);

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
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  // eslint-disable-next-line max-len
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const { investible, market_infos: marketInfos } = fullInvestible;
  const [, tourDispatch] = useContext(TourContext);
  const cognitoUser = useContext(CognitoUserContext) || {};
  const { description, name } = investible;
  const {
    id: marketId,
    market_stage: marketStage,
    expiration_minutes: expirationMinutes,
    created_at: createdAt,
    created_by: createdBy,
    updated_at: updatedAt,
    market_type: marketType,
    parent_market_id: parentMarketId,
    parent_investible_id: parentInvestibleId,
  } = market;
  const safeMarketInfos = marketInfos || [];
  const thisMarketInfo = safeMarketInfos.find((info) => info.market_id === marketId);
  const { children } = thisMarketInfo || {};
  const breadCrumbs = inArchives ? makeArchiveBreadCrumbs(history) : makeBreadCrumbs(history);
  const activeMarket = marketStage === ACTIVE_STAGE;
  const allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const negativeVoters = marketPresences.filter((presence) => {
    const { investments } = presence;
    const negInvestment = investments.find((investment) => {
      const { quantity } = investment;
      return quantity < 0;
    });
    return !_.isEmpty(negInvestment);
  });
  const positiveVoters = marketPresences.filter((presence) => {
    const { investments } = presence;
    const negInvestment = investments.find((investment) => {
      const { quantity } = investment;
      return quantity > 0;
    });
    return !_.isEmpty(negInvestment);
  });
  const metaClasses = useMetaDataStyles();

  useEffect(() => {
    if (!isAdmin) {
      tourDispatch(startTourFamily(INVITE_INITIATIVE_FAMILY_NAME));
    }
  }, [isAdmin, tourDispatch]);



  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
    >
      <UclusionTour
        hidden={hidden}
        name={INVITE_INITIATIVE_FIRST_VIEW}
        family={INVITE_INITIATIVE_FAMILY_NAME}
        steps={inviteInitiativeSteps(cognitoUser)}
        continuous
        hideBackButton
      />
      {!isAdmin && activeMarket && (
        <DismissableText textId='initiativeVotingHelp' />
      )}
      <Card className={classes.root}
        id="initiativeMain"
        elevation={0}
      >
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "initiativeInvestibleDescription"
          })}`}
          type={VOTING_TYPE}
        />
        <Grid container className={classes.mobileColumn}>
          <Grid item md={9} xs={12}>
            <CardContent className={classes.content}>
              <Typography className={classes.title} variant="h3" component="h1">
                {name}
              </Typography>
              <DescriptionOrDiff
                id={investibleId}
                description={description}
              />
            </CardContent>
          </Grid>
          <Grid className={classes.borderLeft} item md={3} xs={12}>
            <CardActions className={classes.actions}>
              <DialogActions
                isAdmin={isAdmin}
                marketStage={marketStage}
                marketType={marketType}
                parentMarketId={parentMarketId}
                parentInvestibleId={parentInvestibleId}
                isFollowing={myPresence.following}
                marketId={marketId}
                initiativeId={investibleId}
              />
            </CardActions>
            <dl className={clsx(metaClasses.root, classes.flexCenter)}>
              <div className={clsx(metaClasses.group, metaClasses.expiration)}>
                <dd>
                  {activeMarket ? (
                    <ExpiresDisplay
                      createdAt={createdAt}
                      expirationMinutes={expirationMinutes}
                      showEdit={isAdmin}
                      history={history}
                      marketId={marketId}
                    />
                  ) : (
                    <ExpiredDisplay
                      expiresDate={updatedAt}
                    />
                  )}
                </dd>
              </div>
              {marketPresences && (
                <>
                  <div className={classes.assignmentContainer}>
                    <FormattedMessage id="author" />
                    <div className={clsx(classes.group, classes.assignments)}>
                      <Collaborators
                        marketPresences={marketPresences}
                        authorId={createdBy}
                        intl={intl}
                        authorDisplay
                      />
                    </div>
                  </div>
                  <div className={classes.assignmentContainer}>
                    <FormattedMessage id="dialogParticipants" />
                    <div className={clsx(classes.group, classes.assignments)}>
                      <Collaborators
                        marketPresences={marketPresences}
                        authorId={createdBy}
                        intl={intl}
                        marketId={marketId}
                        history={history}
                      />
                    </div>
                  </div>
                </>
              )}
              <MarketLinks links={children || []} hidden={hidden} actions={activeMarket ? [<ExpandableAction
                id="link"
                key="link"
                icon={<InsertLinkIcon htmlColor={ACTION_BUTTON_COLOR} />}
                label={intl.formatMessage({ id: 'childPlanExplanation' })}
                openLabel={intl.formatMessage({ id: 'initiativePlanningParent' })}
                onClick={() => navigate(history, `/dialogAdd#type=${PLANNING_TYPE}&investibleId=${investibleId}&id=${marketId}`)}
              />] : []} />
            </dl>
          </Grid>
        </Grid>
      </Card>
      {!isAdmin && activeMarket && (
        <YourVoting
          investibleId={investibleId}
          marketPresences={marketPresences}
          comments={investmentReasons}
          userId={userId}
          market={market}
        />
      )}
      <h2>
        <FormattedMessage id="initiativeVotingFor" />
      </h2>
      <Voting
        investibleId={investibleId}
        marketPresences={positiveVoters}
        investmentReasons={investmentReasons}
      />
      <h2>
        <FormattedMessage id="initiativeVotingAgainst" />
      </h2>
      <Voting
        investibleId={investibleId}
        marketPresences={negativeVoters}
        investmentReasons={investmentReasons}
      />
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ marginTop: '71px' }} id="commentAddArea">
          {!inArchives && !isAdmin && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
            />
          )}
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId} allowedTypes={allowedCommentTypes} />
        </Grid>
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
