/**
 * A component that renders a _decision_ dialog
 */
import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import { useHistory } from 'react-router'
import { Card, CardContent, Container, Grid, makeStyles, Typography } from '@material-ui/core'
import _ from 'lodash'
import AddIcon from '@material-ui/icons/Add'
import {
  formMarketAddInvestibleLink,
  formMarketLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate,
} from '../../../utils/marketIdPathFunctions'
import ProposedIdeas from './ProposedIdeas'
import SubSection from '../../../containers/SubSection/SubSection'
import CurrentVoting from './CurrentVoting'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import Screen from '../../../containers/Screen/Screen'
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments'
import { SECTION_TYPE_SECONDARY } from '../../../constants/global'
import { ACTIVE_STAGE, DECISION_TYPE } from '../../../constants/markets'
import UclusionTour from '../../../components/Tours/UclusionTour'
import CardType from '../../../components/CardType'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import clsx from 'clsx'
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay'
import ExpiredDisplay from '../../../components/Expiration/ExpiredDisplay'
import { useMetaDataStyles } from '../../Investible/Planning/PlanningInvestible'
import Collaborators from '../Collaborators'
import DialogActions from '../../Home/DialogActions'
import ParentSummary from '../ParentSummary'
import CardActions from '@material-ui/core/CardActions'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import { getInlineBreadCrumbs } from '../../Investible/Decision/DecisionInvestible'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import { inviteDialogSteps } from '../../../components/Tours/InviteTours/dialog'
import { CognitoUserContext } from '../../../contexts/CognitoUserContext/CongitoUserContext'
import { startTour } from '../../../contexts/TourContext/tourContextReducer'
import { TourContext } from '../../../contexts/TourContext/TourContext'
import InviteLinker from '../InviteLinker'
import StepButtons from '../../Onboarding/StepButtons'
import queryString from 'query-string'
import { wizardStyles } from '../../Onboarding/OnboardingWizard'
import Header from '../../../containers/Header'
import { INVITE_DIALOG_FIRST_VIEW } from '../../../contexts/TourContext/tourContextHelper'
import { attachFilesToMarket } from '../../../api/markets'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'

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
    draft: {
      color: "#E85757"
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
      },
    },
    content: {
      flexBasis: "100%",
      padding: theme.spacing(4)
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
      [theme.breakpoints.down("xs")]: {
        alignItems: 'center',
        padding: '20px'
      }
    },
    wizardContainer: {
      background: '#efefef',
      padding: '24px 20px 156px',
      marginTop: '80px',
      width: '500px'
    },
  }),
  { name: "DecisionDialog" }
);

function DecisionDialog(props) {
  const {
    market,
    hidden,
    investibles,
    comments,
    marketStages,
    marketPresences,
    myPresence,
    hash,
  } = props;
  const classes = useStyles();
  const metaClasses = useMetaDataStyles();
  const intl = useIntl();
  const isDraft = !_.isEmpty(myPresence) && marketPresences.length === 1;
  const {
    is_admin: isAdmin,
  } = myPresence;
  const [, tourDispatch] = useContext(TourContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const underConsiderationStage = marketStages.find((stage) => stage.allows_investment);
  const proposedStage = marketStages.find((stage) => !stage.allows_investment);
  const history = useHistory();
  const investibleComments = comments.filter((comment) => comment.investible_id);
  const marketComments = comments.filter((comment) => !comment.investible_id);
  const allowedCommentTypes = [QUESTION_TYPE, ISSUE_TYPE];
  const user = useContext(CognitoUserContext) || {};
  const {
    id: marketId,
    name: marketName,
    description,
    market_stage: marketStage,
    market_type: marketType,
    created_at: createdAt,
    updated_at: updatedAt,
    expiration_minutes: expirationMinutes,
    created_by: createdBy,
    parent_market_id: parentMarketId,
    parent_investible_id: parentInvestibleId,
    is_inline: isInline,
    invite_capability: marketToken,
  } = market;
  const [marketState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || (myPresence && !myPresence.following);
  const values = queryString.parse(hash || '');
  const { onboarded } = values || {};
  let breadCrumbTemplates = [];
  if (isInline) {
    breadCrumbTemplates = getInlineBreadCrumbs(marketState, parentMarketId, parentInvestibleId, investiblesState);
  }
  const breadCrumbs = inArchives ? _.isEmpty(breadCrumbTemplates) ? makeArchiveBreadCrumbs(history)
    : makeBreadCrumbs(history, breadCrumbTemplates) : makeBreadCrumbs(history);
  const addLabel = isAdmin ? 'decisionDialogAddInvestibleLabel' : 'decisionDialogProposeInvestibleLabel';
  const addLabelExplanation = isAdmin ? 'decisionDialogAddExplanationLabel' : 'decisionDialogProposeExplanationLabel';

  useEffect(() => {
    if (!onboarded) {
      tourDispatch(startTour(INVITE_DIALOG_FIRST_VIEW));
    }
  }, [onboarded, tourDispatch])

  function onAttachFile(metadatas) {
    return attachFilesToMarket(marketId, metadatas)
      .then((market) => {
        addMarketToStorage(marketsDispatch, diffDispatch, market, false);
      })
  }

  function getInvestiblesForStage(stage) {
    if (stage) {
      return investibles.reduce((acc, inv) => {
        const { market_infos: marketInfos } = inv;
        for (let x = 0; x < marketInfos.length; x += 1) {
          if (marketInfos[x].stage === stage.id) {
            return [...acc, inv];
          }
        }
        return acc;
      }, []);
    }
    return [];
  }
  const underConsideration = getInvestiblesForStage(underConsiderationStage);
  const proposed = getInvestiblesForStage(proposedStage);
  const wizardStyle = wizardStyles();
  if (onboarded) {
    return (
      <div className={hidden ? wizardStyle.hidden : wizardStyle.normal}>
        <Header
          title={intl.formatMessage({ id: 'OnboardingWizardTitle' })}
          breadCrumbs={[]}
          toolbarButtons={[]}
          hidden={hidden}
          appEnabled
          logoLinkDisabled
          hideTools
        />
        <Container className={classes.wizardContainer}>
          <Card className={wizardStyle.baseCard} elevation={0} raised={false}>
            <div>
              <div>
                <Typography variant="body1">
                  We've created your Dialog, please share the link below.
                </Typography>
                <div className={wizardStyle.linkContainer}>
                  <InviteLinker
                    marketType={DECISION_TYPE}
                    marketToken={marketToken}
                  />
                </div>
                <div className={wizardStyle.borderBottom}></div>
                <StepButtons
                  totalSteps={1}
                  currentStep={0}
                  classes={wizardStyle}
                  showGoBack={false}
                  finishLabel="DialogWizardTakeMeToDialog"
                  showStartOver={false}
                  onFinish={() => history.push(formMarketLink(marketId))}/>
              </div>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <Screen
      title={isInline ? intl.formatMessage({ id: 'archiveInlineTitle' }) : marketName}
      tabTitle={marketName}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      <UclusionTour
        hidden={hidden}
        name={INVITE_DIALOG_FIRST_VIEW}
        steps={inviteDialogSteps(user)}
      />
      <Card elevation={0} className={classes.root}>
        <CardType
          className={classes.cardType}
          type={DECISION_TYPE}
        />
        <Grid id="dialogMain" container className={classes.mobileColumn}>
          <Grid item xs={9}>
            <CardContent className={classes.content}>
              {isDraft && activeMarket && (
                <Typography className={classes.draft}>
                  {intl.formatMessage({ id: 'draft' })}
                </Typography>
              )}
              {!isInline && (
                <>
                  <Typography className={classes.title} variant="h3" component="h1">
                    {marketName}
                  </Typography>
                  <DescriptionOrDiff id={marketId} description={description}/>
                </>
              )}
            </CardContent>
          </Grid>
          <Grid className={classes.borderLeft} item xs={3}>
            <CardActions className={classes.actions}>
              <DialogActions
                isAdmin={myPresence.is_admin}
                isFollowing={myPresence.following}
                isGuest={myPresence.market_guest}
                marketStage={marketStage}
                marketType={marketType}
                parentMarketId={parentMarketId}
                parentInvestibleId={parentInvestibleId}
                marketId={marketId}
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
              <ParentSummary market={market} hidden={hidden}/>
            </dl>
            {!inArchives && (
              <dl className={metaClasses.root}>
                <div className={clsx(metaClasses.group, metaClasses.assignments)}>
                  <ExpandableAction
                    id="proposeOption"
                    onClick={() => navigate(history, formMarketAddInvestibleLink(marketId))}
                    icon={<AddIcon htmlColor={ACTION_BUTTON_COLOR} />}
                    label={intl.formatMessage({ id: addLabelExplanation })}
                    openLabel={intl.formatMessage({ id: addLabel })}
                  />
                </div>
              </dl>
            )}
            <dl className={metaClasses.root}>
              <AttachedFilesList
                key="files"
                marketId={marketId}
                attachedFiles={market.attached_files}
                onUpload={onAttachFile} />
            </dl>
          </Grid>
        </Grid>
      </Card>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SubSection
            id="currentVoting"
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel' })}
          >
            <CurrentVoting
              marketPresences={marketPresences}
              investibles={underConsideration}
              marketId={marketId}
              comments={investibleComments}
              inArchives={inArchives}
            />
          </SubSection>
        </Grid>
        {!_.isEmpty(proposed) && (
          <Grid item xs={12} style={{ marginTop: '56px' }}>
            <SubSection
              type={SECTION_TYPE_SECONDARY}
              title={intl.formatMessage({ id: 'decisionDialogProposedOptionsLabel' })}
            >
              <ProposedIdeas
                investibles={proposed}
                marketId={marketId}
              />
            </SubSection>
          </Grid>
        )}
        <Grid id="commentAddArea" item xs={12} style={{ marginTop: '71px' }}>
          {!inArchives && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              marketId={marketId}
              issueWarningId="issueWarning"
            />
          )}
          <CommentBox
            comments={marketComments}
            marketId={marketId}
            allowedTypes={allowedCommentTypes}
          />
        </Grid>
      </Grid>
    </Screen>
  );
}

DecisionDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketStages: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  myPresence: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  hash: PropTypes.string.isRequired,
};

DecisionDialog.defaultProps = {
  investibles: [],
  comments: [],
  marketStages: [],
  hidden: false,
};

export default DecisionDialog;
