import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardContent, Divider, Grid, makeStyles, Typography } from '@material-ui/core'
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from '../Voting/YourVoting';
import Voting from '../Decision/Voting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE,
} from '../../../constants/comments';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import Screen from '../../../containers/Screen/Screen';
import {
  formMarketManageLink, makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate,
} from '../../../utils/marketIdPathFunctions'
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges';
import { ACTIVE_STAGE, PLANNING_TYPE } from '../../../constants/markets';
import AddParticipantsActionButton from '../../Dialog/AddParticipantsActionButton';
import { SECTION_TYPE_SECONDARY } from '../../../constants/global';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import InsertLinkIcon from '@material-ui/icons/InsertLink';
import MarketLinks from '../../Dialog/MarketLinks';
import CardType, { VOTING_TYPE } from '../../../components/CardType';
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff';
import ExpiredDisplay from '../../../components/Expiration/ExpiredDisplay';
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay';
import clsx from 'clsx';
import { useMetaDataStyles } from '../Planning/PlanningInvestible';
import DialogActions from '../../Home/DialogActions'
import Box from '@material-ui/core/Box'

const useStyles = makeStyles(
  theme => ({
    cardType: {
      display: "inline-flex"
    },
    votingCardContent: {
      margin: theme.spacing(2, 6),
      padding: 0
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
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
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
  } = market;
  const safeMarketInfos = marketInfos || [];
  const thisMarketInfo = safeMarketInfos.find((info) => info.market_id === marketId);
  const { children } = thisMarketInfo || {};
  const breadCrumbs = inArchives ? makeArchiveBreadCrumbs(history) : makeBreadCrumbs(history);
  const commentAddRef = useRef(null);
  const activeMarket = marketStage === ACTIVE_STAGE;
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
  }

  function closeCommentAdd() {
    setCommentAddHidden(true);
  }

  function toggleAddParticipantsMode() {
    navigate(history, formMarketManageLink(marketId));
  }

  function getSidebarActions() {
    if (!activeMarket) {
      return [];
    }
    const sidebarActions = [];

    sidebarActions.push(<AddParticipantsActionButton key="addParticipants" onClick={toggleAddParticipantsMode} />);
    sidebarActions.push(<RaiseIssue key="issue" onClick={commentButtonOnClick} />);
    sidebarActions.push(<AskQuestions key="question" onClick={commentButtonOnClick} />);
    sidebarActions.push(<SuggestChanges key="suggest" onClick={commentButtonOnClick} />);
    sidebarActions.push(<ExpandableSidebarAction
      id="link"
      key="link"
      icon={<InsertLinkIcon />}
      label={intl.formatMessage({ id: 'initiativePlanningParent' })}
      onClick={() => navigate(history, `/dialogAdd#type=${PLANNING_TYPE}&investibleId=${investibleId}&id=${marketId}`)}
    />)
    return sidebarActions;
  }
  const metaClasses = useMetaDataStyles();
  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }

  const hasDiscussion = !_.isEmpty(investmentReasonsRemoved);
  const discussionVisible = !commentAddHidden || hasDiscussion;

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      sidebarActions={getSidebarActions()}
      hidden={hidden}
    >
      <Card elevation={0}>
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "initiativeInvestibleDescription"
          })}`}
          type={VOTING_TYPE}
        />
        <CardContent className={classes.votingCardContent}>
          <h1>
            {name}
            <DialogActions
              isAdmin={isAdmin}
              marketStage={marketStage}
              marketType={marketType}
              inArchives={myPresence.market_hidden}
              marketId={marketId}
              initiativeId={investibleId}
            />
          </h1>
          <DescriptionOrDiff
            hidden={hidden}
            id={investibleId}
            description={description}
          />
          <Divider />
          <MarketLinks links={children || []} hidden={hidden} />
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
                    onClick={() => isAdmin && navigate(history, formMarketManageLink(marketId))}
                  />
                ) : (
                  <ExpiredDisplay
                    expiresDate={updatedAt}
                  />
                )}
              </dd>
            </div>
            {marketPresences && (
              <div className={clsx(metaClasses.group, metaClasses.assignments)}>
                <dt>
                  <FormattedMessage id="dialogParticipants" />
                </dt>
                <dd>
                  <Collaborators
                    marketPresences={marketPresences}
                    authorId={createdBy}
                    intl={intl}
                  />
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
      {!isAdmin && (
        <YourVoting
          investibleId={investibleId}
          marketPresences={marketPresences}
          comments={investmentReasons}
          userId={userId}
          market={market}
        />
      )}
      <h2>
        <FormattedMessage id="decisionInvestibleOthersVoting" />
      </h2>
      <Voting
        investibleId={investibleId}
        marketPresences={marketPresences}
        investmentReasons={investmentReasons}
      />
      <Grid container spacing={2}>
        {discussionVisible && (
          <Grid item xs={12}>

            <SubSection
              type={SECTION_TYPE_SECONDARY}
              title={intl.formatMessage({ id: 'initiativeInvestibleDiscussion' })}
            >
              <CommentAddBox
                hidden={commentAddHidden}
                allowedTypes={allowedCommentTypes}
                investible={investible}
                marketId={marketId}
                type={commentAddType}
                onSave={closeCommentAdd}
                onCancel={closeCommentAdd}
              />
              <div ref={commentAddRef} />
              <CommentBox comments={investmentReasonsRemoved} marketId={marketId} />
            </SubSection>
          </Grid>
        )}
      </Grid>
    </Screen>
  );
}

export function Collaborators(props) {
  const { marketPresences, authorId, intl } = props;
  marketPresences.sort(function(a, b) {
    if (a.id === authorId) return -1;
    return 0;
  })
  return (
    <>
    <ul>
    {marketPresences.length === 1 && (
      <Typography>
        <Box color="#E85757" m={1}>
          {intl.formatMessage({ id: 'draft' })}
        </Box>
      </Typography>
    )}
    </ul>
    <ul>
      {marketPresences.map(presence => {
        const { id: presenceId, name } = presence;
        return (
          <Typography key={presenceId} component="li">
            {presenceId === authorId ? (
              <Box fontSize={24} m={1}>
                {name}
              </Box>
            ) : (name)}
          </Typography>
        );
      })}
    </ul>
    </>
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
