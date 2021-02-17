/**
 * A component that renders a _decision_ dialog
 */
import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import { useHistory } from 'react-router'
import { Card, CardContent, Grid, makeStyles, Typography } from '@material-ui/core'
import _ from 'lodash'
import AddIcon from '@material-ui/icons/Add'
import {
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
} from '../../../utils/marketIdPathFunctions'
import ProposedIdeas from './ProposedIdeas'
import SubSection from '../../../containers/SubSection/SubSection'
import CurrentVoting from './CurrentVoting'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import Screen from '../../../containers/Screen/Screen'
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments'
import { EMPTY_SPIN_RESULT, SECTION_TYPE_SECONDARY } from '../../../constants/global'
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
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { inviteDialogSteps } from '../../../components/Tours/InviteTours/dialog'
import { CognitoUserContext } from '../../../contexts/CognitoUserContext/CongitoUserContext'
import { startTour } from '../../../contexts/TourContext/tourContextReducer'
import { TourContext } from '../../../contexts/TourContext/TourContext'
import { INVITE_DIALOG_FIRST_VIEW } from '../../../contexts/TourContext/tourContextHelper'
import { attachFilesToMarket, deleteAttachedFilesFromMarket } from '../../../api/markets'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import DialogBodyEdit from '../DialogBodyEdit'
import { doSetEditWhenValid, isTinyWindow } from '../../../utils/windowUtils'
import DecisionInvestibleAdd from './DecisionInvestibleAdd'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import localforage from 'localforage'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import GavelIcon from '@material-ui/icons/Gavel';

const useStyles = makeStyles(
  theme => ({
    root: {
      alignItems: "flex-start",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      overflow: "visible",
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
      padding: '0 2rem 2rem 2rem',
      marginBottom: '-5px',
      marginTop: '-30px',
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
    editContent: {
      flexBasis: "100%",
      padding: theme.spacing(4, 1, 4, 1)
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
    titleEditable: {
      fontSize: 32,
      fontWeight: "bold",
      lineHeight: "42px",
      paddingBottom: "9px",
      cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
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
    fullWidthCentered: {
      alignItems: 'center',
      justifyContent: 'center',
      display: "flex",
      marginTop: '20px',
      [theme.breakpoints.down("xs")]: {
        maxWidth: '100%',
        flexBasis: '100%',
        flexDirection: 'column'
      }
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
    banner,
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
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [investibleAdd, setInvestibleAdd] = useState(false);
  const [storedState, setStoredState] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);
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
    parent_investible_id: parentInvestibleId
  } = market;
  const [beingEdited, setBeingEdited] = useState(undefined);
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || (myPresence && !myPresence.following);
  const breadCrumbs = inArchives ? makeArchiveBreadCrumbs(history) : makeBreadCrumbs(history);

  useEffect(() => {
    tourDispatch(startTour(INVITE_DIALOG_FIRST_VIEW));
  }, [tourDispatch]);

  useEffect(() => {
    if (investibleAdd) {
      localforage.getItem(`add_investible_${marketId}`).then((stateFromDisk) => {
        setStoredState(stateFromDisk || {});
        setIdLoaded(marketId);
      });
    }
    if (!investibleAdd) {
      setIdLoaded(undefined);
    }
  }, [investibleAdd, marketId]);

  function onAttachFile(metadatas) {
    return attachFilesToMarket(marketId, metadatas)
      .then((market) => {
        addMarketToStorage(marketsDispatch, diffDispatch, market, false);
      })
  }

  function toggleInvestibleAdd() {
    setInvestibleAdd(!investibleAdd);
  }

  function isEditableByUser() {
    return isAdmin && !inArchives;
  }


  function mySetBeingEdited(isEdit, event) {
    doSetEditWhenValid(isEdit, isEditableByUser, setBeingEdited, marketId, event);
  }

  function onDeleteFile(path) {
    return deleteAttachedFilesFromMarket(marketId, [path])
      .then((market) => {
        addMarketToStorage(marketsDispatch, diffDispatch, market, false);
        return EMPTY_SPIN_RESULT;
      })
  }

  function getInvestiblesForStage(stage) {
    if (stage) {
      return investibles.reduce((acc, inv) => {
        const { market_infos: marketInfos } = inv;
        for (let x = 0; x < marketInfos.length; x += 1) {
          if (marketInfos[x].stage === stage.id) {
            // filter out "deleted" investibles
            if (!marketInfos[x].deleted) {
              return [...acc, inv];
            }
          }
        }
        return acc;
      }, []);
    }
    return [];
  }
  const underConsideration = getInvestiblesForStage(underConsiderationStage);
  const proposed = getInvestiblesForStage(proposedStage);
  const myBeingEdited = beingEdited === marketId && isEditableByUser();
  return (
    <Screen
      title={marketName}
      titleIcon={<GavelIcon/>}
      tabTitle={marketName}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      banner={banner}
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
          createdAt={createdAt}
          myBeingEdited={myBeingEdited}
        />
        <Grid id="dialogMain" container className={classes.mobileColumn}>
          <Grid item xs={9}>
            <CardContent className={myBeingEdited ? classes.editContent : classes.content}>
              {isDraft && activeMarket && (
                <Typography className={classes.draft}>
                  {intl.formatMessage({ id: 'draft' })}
                </Typography>
              )}
              {myBeingEdited  && (
                <DialogBodyEdit hidden={hidden} setBeingEdited={mySetBeingEdited} marketId={marketId} />
              )}
              {!myBeingEdited && (
                <>
                  <Typography className={isEditableByUser() ? classes.titleEditable : classes.title}
                              variant="h3" component="h1"
                              onClick={() => !isTinyWindow() && mySetBeingEdited(true)}>
                    {marketName}
                  </Typography>
                  <DescriptionOrDiff id={marketId} description={description}
                                     setBeingEdited={isTinyWindow() ? () => {} : mySetBeingEdited}
                                     isEditable={isEditableByUser()}/>
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
                mySetBeingEdited={mySetBeingEdited}
                beingEdited={beingEdited}
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
            <dl className={metaClasses.root}>
              <AttachedFilesList
                key="files"
                marketId={marketId}
                isAdmin={isAdmin}
                attachedFiles={market.attached_files}
                onUpload={onAttachFile}
                onDeleteClick={onDeleteFile}
              />
            </dl>
          </Grid>
        </Grid>
      </Card>
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ marginTop: '2rem' }}>
          {investibleAdd && idLoaded === marketId && (
            <div style={{marginBottom: '2rem'}}>
              <DecisionInvestibleAdd
                marketId={marketId}
                onSave={(investible) => addInvestible(investiblesDispatch, () => {}, investible)}
                onCancel={toggleInvestibleAdd}
                onSpinComplete={toggleInvestibleAdd}
                isAdmin={isAdmin}
                storedState={storedState}
              />
            </div>
          )}
          <SubSection
            id="currentVoting"
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel' })}
            actionButton={ inArchives ? null :
              (<ExpandableAction
                icon={<AddIcon htmlColor="white"/>}
                label={intl.formatMessage({ id: 'decisionDialogAddExplanationLabel' })}
                openLabel={intl.formatMessage({ id: 'decisionDialogAddInvestibleLabel'})}
                useWhiteText
                onClick={toggleInvestibleAdd}
                disabled={!isAdmin}
                tipPlacement="top-end"
              />)}
          >
            <CurrentVoting
              marketPresences={marketPresences}
              investibles={underConsideration}
              marketId={marketId}
              comments={investibleComments}
              inArchives={inArchives}
              isAdmin={isAdmin}
            />
          </SubSection>
        </Grid>
        <Grid item xs={12} style={{ marginTop: '1.5rem' }}>
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogProposedOptionsLabel' })}
            actionButton={ inArchives ? null :
              (<ExpandableAction
                icon={<AddIcon htmlColor="white"/>}
                label={intl.formatMessage({ id: 'decisionDialogProposeExplanationLabel' })}
                openLabel={intl.formatMessage({ id: 'decisionDialogProposeInvestibleLabel'})}
                useWhiteText
                onClick={toggleInvestibleAdd}
                disabled={isAdmin}
                tipPlacement="top-end"
              />)}
          >
            <ProposedIdeas
              investibles={proposed}
              marketId={marketId}
              isAdmin={isAdmin}
            />
          </SubSection>
        </Grid>
        <Grid id="commentAddArea" item xs={12} style={{ marginTop: '71px' }}>
          {!inArchives && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              marketId={marketId}
              issueWarningId="issueWarning"
              hidden={hidden}
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
  market: PropTypes.object.isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
  comments: PropTypes.arrayOf(PropTypes.object),
  marketStages: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  myPresence: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
};

DecisionDialog.defaultProps = {
  investibles: [],
  comments: [],
  marketStages: [],
  hidden: false,
};

export default DecisionDialog;
