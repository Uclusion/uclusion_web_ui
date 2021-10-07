import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { FormattedMessage, useIntl } from 'react-intl'
import _ from 'lodash'
import { Card, CardContent, Grid, makeStyles, Typography } from '@material-ui/core'
import YourVoting from '../Voting/YourVoting'
import Voting from '../Decision/Voting'
import CommentBox, { getSortedRoots } from '../../../containers/CommentBox/CommentBox'
import { JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, } from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import Screen from '../../../containers/Screen/Screen'
import {
  baseNavListItem, formInvestibleLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate,
} from '../../../utils/marketIdPathFunctions'
import { ACTIVE_STAGE, PLANNING_TYPE } from '../../../constants/markets'
import InsertLinkIcon from '@material-ui/icons/InsertLink'
import MarketLinks from '../../Dialog/MarketLinks'
import CardType, { VOTING_TYPE } from '../../../components/CardType'
import ExpiredDisplay from '../../../components/Expiration/ExpiredDisplay'
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay'
import clsx from 'clsx'
import { useMetaDataStyles } from '../Planning/PlanningInvestible'
import DialogActions from '../../Home/DialogActions'
import Collaborators from '../../Dialog/Collaborators'
import CardActions from '@material-ui/core/CardActions'
import DismissableText from '../../../components/Notifications/DismissableText'
import { TourContext } from '../../../contexts/TourContext/TourContext'
import { startTour } from '../../../contexts/TourContext/tourContextReducer'
import UclusionTour from '../../../components/Tours/UclusionTour'
import { CognitoUserContext } from '../../../contexts/CognitoUserContext/CongitoUserContext'
import { adminInitiativeSteps } from '../../../components/Tours/adminInitiative'
import {
  ADMIN_INITIATIVE_FIRST_VIEW,
  INVITE_INITIATIVE_FIRST_VIEW
} from '../../../contexts/TourContext/tourContextHelper'
import { inviteInitiativeSteps } from '../../../components/Tours/initiative'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import { attachFilesToMarket, deleteAttachedFilesFromMarket } from '../../../api/markets'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
import { doSetEditWhenValid } from '../../../utils/windowUtils'
import { Assessment, ExpandLess, QuestionAnswer, SettingsBackupRestore } from '@material-ui/icons'
import EditIcon from '@material-ui/icons/Edit'
import AddIcon from '@material-ui/icons/Add'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import ThumbUpIcon from '@material-ui/icons/ThumbUp'
import ThumbDownIcon from '@material-ui/icons/ThumbDown'
import { getFakeCommentsArray } from '../../../utils/stringFunctions'
import InvestibleBodyEdit from '../InvestibleBodyEdit'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { findMessageOfTypeAndId } from '../../../utils/messageUtils'
import { getDiff, markDiffViewed } from '../../../contexts/DiffContext/diffContextHelper'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { deleteSingleMessage } from '../../../api/users'
import { removeMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import DialogManage from '../../Dialog/DialogManage'

const useStyles = makeStyles(
  theme => ({
    root: {
      alignItems: "flex-start",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      overflow: "visible"
    },
    cardType: {
      display: "inline-flex"
    },
    mobileColumn: {
      [theme.breakpoints.down("sm")]: {
        flexDirection: 'column'
      }
    },
    borderLeft: {
      padding: '0 2rem 2rem 2rem',
      marginBottom: '-5px',
      marginTop: '-30px',
      [theme.breakpoints.down("sm")]: {
        padding: '1rem 0',
        marginTop: '1rem',
        borderLeft: 'none',
        borderTop: '1px solid #e0e0e0',
        flexGrow: 'unset',
        maxWidth: 'unset',
        flexBasis: 'auto'
      }
    },
    draft: {
      color: "#E85757"
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
    editContent: {
      flexBasis: "100%",
      padding: theme.spacing(4, 1, 4, 1)
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
    flexCenter: {
      [theme.breakpoints.down("sm")]: {
        alignItems: 'center',
        padding: '20px'
      }
    },
    fullWidthCentered: {
      alignItems: 'center',
      justifyContent: 'center',
      display: "flex",
      marginTop: '20px',
      [theme.breakpoints.down("sm")]: {
        maxWidth: '100%',
        flexBasis: '100%',
        flexDirection: 'column'
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
  const isDraft = !_.isEmpty(myPresence) && marketPresences.length === 1;
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const { investible, market_infos: marketInfos } = fullInvestible;
  const [, tourDispatch] = useContext(TourContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const myMessage = findMessageOfTypeAndId(investibleId, messagesState);
  const diff = getDiff(diffState, investibleId);
  const [searchResults] = useContext(SearchResultsContext);
  const [pageStateFull, pageDispatch] = usePageStateReducer('investible');
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
    attached_files: attachedFiles,
  } = market;
  const [pageState, updatePageState, pageStateReset] =
    getPageReducerPage(pageStateFull, pageDispatch, investibleId,
      { collaboratorsOpen: isDraft && myPresence.id === createdBy, changeExpires: false });
  const {
    beingEdited,
    showDiff,
    collaboratorsOpen,
    changeExpires
  } = pageState;
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [votingPageState, updateVotingPageState, votingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId);

  const cognitoUser = useContext(CognitoUserContext) || {};
  const { name } = investible;
  const safeMarketInfos = marketInfos || [];
  const thisMarketInfo = safeMarketInfos.find((info) => info.market_id === marketId);
  const { children } = thisMarketInfo || {};
  const breadCrumbs = inArchives ? makeArchiveBreadCrumbs(history) : makeBreadCrumbs(history);
  const activeMarket = marketStage === ACTIVE_STAGE;
  const allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const negativeVoters = marketPresences.filter((presence) => {
    const { investments } = presence;
    const negInvestment = (investments || []).find((investment) => {
      const { quantity } = investment;
      return quantity < 0;
    });
    return !_.isEmpty(negInvestment);
  });
  const positiveVoters = marketPresences.filter((presence) => {
    const { investments } = presence
    const negInvestment = (investments || []).find((investment) => {
      const { quantity } = investment
      return quantity > 0
    })
    return !_.isEmpty(negInvestment)
  });
  const metaClasses = useMetaDataStyles()
  const tourName = isAdmin ? ADMIN_INITIATIVE_FIRST_VIEW : INVITE_INITIATIVE_FIRST_VIEW
  const tourSteps = isAdmin ? adminInitiativeSteps(cognitoUser) : inviteInitiativeSteps(cognitoUser)
  const yourPresence = marketPresences.find((presence) => presence.current_user)
  const yourVote = yourPresence && yourPresence.investments &&
    yourPresence.investments.find((investment) => investment.investible_id === investibleId)

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, investibleId);
    }
    updatePageState({showDiff: !showDiff});
  }

  function isEditableByUser() {
    return isAdmin && !inArchives;
  }
  function onAttachFile (metadatas) {
    return attachFilesToMarket(marketId, metadatas)
      .then((market) => {
        addMarketToStorage(marketsDispatch, diffDispatch, market, false)
      })
  }

  function onDeleteFile (path) {
    return deleteAttachedFilesFromMarket(marketId, [path])
      .then((market) => {
        addMarketToStorage(marketsDispatch, diffDispatch, market, false);
        return EMPTY_SPIN_RESULT;
      });
  }

  function mySetBeingEdited(isEdit, event) {
    doSetEditWhenValid(isEdit, isEditableByUser,
      (value) => updatePageState({beingEdited: value, name}), event, history);
  }

  useEffect(() => {
      tourDispatch(startTour(tourName));
  }, [tourDispatch, tourName]);

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }
  function createNavListItem(icon, textId, anchorId, howManyNum, alwaysShow) {
    return baseNavListItem(formInvestibleLink(marketId, investibleId), icon, textId, anchorId, howManyNum, alwaysShow);
  }
  const votingAllowed = !isAdmin && !inArchives;
  const displayVoting = votingAllowed && !yourVote;
  const openComments = investmentReasonsRemoved.filter((comment) => !comment.resolved) || [];
  const closedComments = investmentReasonsRemoved.filter((comment) => comment.resolved) || [];
  const sortedClosedRoots = getSortedRoots(closedComments, searchResults);
  const { id: closedId } = getFakeCommentsArray(sortedClosedRoots)[0];
  const sortedRoots = getSortedRoots(openComments, searchResults);
  const questions = sortedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE);
  const { id: questionId } = getFakeCommentsArray(questions)[0];
  const suggestions = sortedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE);
  const { id: suggestId } = getFakeCommentsArray(suggestions)[0]
  const navigationMenu = {
    navHeaderIcon: Assessment, navTooltip: 'initiativeNavTooltip',
    navListItemTextArray: [createNavListItem(EditIcon, 'description_label', 'initiativeMain'),
      createNavListItem(ThumbUpIcon, 'for', 'for', _.size(positiveVoters), true),
      createNavListItem(ThumbDownIcon, 'against', 'against', _.size(negativeVoters), true),
      inArchives ? {} : createNavListItem(AddIcon, 'commentAddBox'),
      createNavListItem(QuestionIcon, 'questions', `c${questionId}`, _.size(questions)),
      createNavListItem(ChangeSuggstionIcon, 'suggestions', `c${suggestId}`, _.size(suggestions)),
      createNavListItem(QuestionAnswer, 'closedComments', `c${closedId}`, _.size(sortedClosedRoots)),
      createNavListItem(PlaylistAddCheckIcon, 'planningMarkets', 'dia0', _.size(children))
    ]
  }
  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      navigationOptions={navigationMenu}
    >
      <UclusionTour
        hidden={hidden}
        name={tourName}
        steps={tourSteps}
        continuous
        hideBackButton
      />
      {collaboratorsOpen && (
        <DialogManage marketId={marketId} onClose={() => updatePageState({collaboratorsOpen: false})}/>
      )}
      {changeExpires && (
        <DialogManage marketId={marketId} expires={true} onClose={() => updatePageState({changeExpires: false})}/>
      )}
      {!isAdmin && !inArchives && (
        <DismissableText textId='initiativeVotingHelp'/>
      )}
      <Card className={classes.root} id="initiativeMain" elevation={3}>
        <CardType
          className={classes.cardType}
          type={VOTING_TYPE}
          createdAt={createdAt}
          myBeingEdited={beingEdited}
        />
        <Grid container className={classes.mobileColumn}>
          <Grid item md={9} xs={12}
                onClick={(event) => !beingEdited && mySetBeingEdited(true, event)}>
            <CardContent className={beingEdited ? classes.editContent : classes.content}>
              {isDraft && activeMarket && (
                <Typography className={classes.draft}>
                  {intl.formatMessage({ id: "draft" })}
                </Typography>
              )}
              {marketId && userId && (
                <InvestibleBodyEdit hidden={hidden} marketId={marketId} investibleId={investibleId}
                                    userId={userId}
                                    pageState={pageState}
                                    pageStateUpdate={updatePageState}
                                    pageStateReset={pageStateReset}
                                    fullInvestible={fullInvestible}
                          setBeingEdited={mySetBeingEdited} beingEdited={beingEdited}
                          isEditableByUser={isEditableByUser} />
              )}
            </CardContent>
          </Grid>
          <Grid className={classes.borderLeft} item md={3} xs={12}>
            <CardActions className={classes.actions}>
              <DialogActions
                isAdmin={isAdmin}
                marketStage={marketStage}
                marketType={marketType}
                marketPresences={marketPresences}
                parentMarketId={parentMarketId}
                parentInvestibleId={parentInvestibleId}
                isFollowing={myPresence.following}
                marketId={marketId}
                initiativeId={investibleId}
                mySetBeingEdited={mySetBeingEdited}
                pageState={pageState}
                updatePageState={updatePageState}
              />
            </CardActions>
            <dl className={clsx(metaClasses.root, classes.flexCenter)}>
              {activeMarket ? (
                  <ExpiresDisplay createdAt={createdAt} expirationMinutes={expirationMinutes} />
                ) : (
                  <ExpiredDisplay expiresDate={updatedAt} />
              )}
              {marketPresences && (
                <>
                  <div className={clsx(classes.group, classes.assignments)}>
                    <div className={classes.assignmentContainer}>
                      <b><FormattedMessage id="author"/></b>
                      <Collaborators
                        marketPresences={marketPresences}
                        authorId={createdBy}
                        intl={intl}
                        authorDisplay
                      />
                    </div>
                  </div>
                  <div className={clsx(classes.group, classes.assignments)}>
                    <div className={classes.assignmentContainer}>
                      <b><FormattedMessage id="dialogParticipants"/></b>
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
              {!inArchives && isAdmin && (
                <>
                  <SpinningIconLabelButton
                    id="link" key="link"
                    onClick={() => navigate(history, `/dialogAdd#type=${PLANNING_TYPE}&investibleId=${investibleId}&id=${marketId}`)}
                    doSpin={false} icon={InsertLinkIcon}>
                    <FormattedMessage id="initiativePlanningParent"/>
                  </SpinningIconLabelButton>
                  <div style={{paddingTop: '0.5rem'}} />
                </>
              )}
              {myMessage && (
                <>
                  <SpinningIconLabelButton icon={SettingsBackupRestore}
                                           onClick={() => {
                                             deleteSingleMessage(myMessage).then(() => {
                                               messagesDispatch(removeMessage(myMessage));
                                               setOperationRunning(false);
                                             }).finally(() => {
                                               setOperationRunning(false);
                                             });
                                           }}
                                           doSpin={true}>
                    <FormattedMessage id={'markDescriptionRead'} />
                  </SpinningIconLabelButton>
                  <div style={{paddingTop: '0.1rem'}} />
                </>
              )}
              {myMessage && diff && (
                <>
                  <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon}
                                           onClick={toggleDiffShow} doSpin={false}>
                    <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
                  </SpinningIconLabelButton>
                  <div style={{paddingTop: '0.5rem'}} />
                </>
              )}
              <AttachedFilesList
                key="files"
                marketId={marketId}
                isAdmin={isAdmin}
                onDeleteClick={onDeleteFile}
                attachedFiles={attachedFiles}
                onUpload={onAttachFile}/>
            </dl>
          </Grid>
        </Grid>
      </Card>
      {displayVoting && investibleId && (
        <>
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            market={market}
            votingPageState={votingPageState}
            updateVotingPageState={updateVotingPageState}
            votingPageStateReset={votingPageStateReset}
          />
          {!yourVote && marketId && !_.isEmpty(investible) && !hidden && (
            <>
              <h3>{intl.formatMessage({ id: 'orStructuredComment' })}</h3>
              <CommentAddBox
                allowedTypes={allowedCommentTypes}
                investible={investible}
                marketId={marketId}
              />
            </>
          )}
        </>
      )}
      <h2 id="for">
        <FormattedMessage id="initiativeVotingFor"/>
      </h2>
      <Voting
        investibleId={investibleId}
        marketPresences={positiveVoters}
        investmentReasons={investmentReasons}
        votingPageState={votingPageState}
        updateVotingPageState={updateVotingPageState}
        votingPageStateReset={votingPageStateReset}
        market={market}
        votingAllowed={votingAllowed}
        yourPresence={yourPresence}
      />
      <h2 id="against">
        <FormattedMessage id="initiativeVotingAgainst" />
      </h2>
      <Voting
        investibleId={investibleId}
        marketPresences={negativeVoters}
        investmentReasons={investmentReasons}
        votingPageState={votingPageState}
        updateVotingPageState={updateVotingPageState}
        votingPageStateReset={votingPageStateReset}
        market={market}
        votingAllowed={votingAllowed}
        yourPresence={yourPresence}
      />
      <MarketLinks links={children || []} />
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ marginTop: '71px' }} id="commentAddArea">
          {!inArchives && !isAdmin && yourVote && marketId && !_.isEmpty(investible) && !hidden && (
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
