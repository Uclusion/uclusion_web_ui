import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { FormattedMessage, useIntl } from 'react-intl'
import _ from 'lodash'
import { Card, CardContent, Divider, Grid, makeStyles, Typography } from '@material-ui/core'
import YourVoting from '../Voting/YourVoting'
import Voting from '../Decision/Voting'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, } from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import Screen from '../../../containers/Screen/Screen'
import {

  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate,
} from '../../../utils/marketIdPathFunctions'
import { ACTIVE_STAGE, PLANNING_TYPE } from '../../../constants/markets'
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction'
import InsertLinkIcon from '@material-ui/icons/InsertLink'
import MarketLinks from '../../Dialog/MarketLinks'
import CardType, { VOTING_TYPE } from '../../../components/CardType'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import ExpiredDisplay from '../../../components/Expiration/ExpiredDisplay'
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay'
import clsx from 'clsx'
import { useMetaDataStyles } from '../Planning/PlanningInvestible'
import DialogActions from '../../Home/DialogActions'
import Collaborators from '../../Dialog/Collaborators';
import CardActions from '@material-ui/core/CardActions'
import DismissableText from '../../../components/Notifications/DismissableText'

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
    actions: {},
    content: {
      flexBasis: "100%",
      padding: theme.spacing(0, 4)
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
  function getSidebarActions() {
    if (!activeMarket) {
      return [];
    }
    const sidebarActions = [];
    sidebarActions.push(<ExpandableSidebarAction
      id="link"
      key="link"
      icon={<InsertLinkIcon />}
      label={intl.formatMessage({ id: 'childPlanExplanation' })}
      openLabel={intl.formatMessage({ id: 'initiativePlanningParent' })}
      onClick={() => navigate(history, `/dialogAdd#type=${PLANNING_TYPE}&investibleId=${investibleId}&id=${marketId}`)}
    />);
    return sidebarActions;
  }
  const metaClasses = useMetaDataStyles();
  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      sidebarActions={getSidebarActions()}
      hidden={hidden}
    >
      {!isAdmin && activeMarket && (
        <DismissableText textId='initiativeVotingHelp' />
      )}
      <Card className={classes.root}>
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "initiativeInvestibleDescription"
          })}`}
          type={VOTING_TYPE}
        />
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
        <CardContent className={classes.content}>
          <Typography className={classes.title} variant="h3" component="h1">
            {name}
          </Typography>
          <DescriptionOrDiff
            id={investibleId}
            description={description}
          />
          <Divider />
          <dl className={metaClasses.root}>
            <div className={clsx(metaClasses.group, metaClasses.expiration)}>
              {activeMarket && (
                <dt>
                  <FormattedMessage id="initiativeExpiration" />
                </dt>
              )}
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
              <div className={clsx(metaClasses.group, metaClasses.assignments)}>
                <dt>
                  <FormattedMessage id="author" />
                </dt>
                <dd>
                  <Collaborators
                    marketPresences={marketPresences}
                    authorId={createdBy}
                    intl={intl}
                    authorDisplay
                  />
                </dd>
              </div>
              <div className={clsx(metaClasses.group, metaClasses.assignments)}>
                <dt>
                  <FormattedMessage id="dialogParticipants" />
                </dt>
                <dd>
                  <Collaborators
                    marketPresences={marketPresences}
                    authorId={createdBy}
                    intl={intl}
                    marketId={marketId}
                    history={history}
                  />
                </dd>
              </div>
              </>
            )}
            <MarketLinks links={children || []} hidden={hidden} />
          </dl>
        </CardContent>
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
        <Grid item xs={12} style={{ marginTop: '71px' }}>
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
