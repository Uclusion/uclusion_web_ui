import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardActions, CardContent, Grid,Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import clsx from 'clsx'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import DialogActions from '../../Home/DialogActions'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import CardType, { AGILE_PLAN_TYPE, DECISION_TYPE } from '../../../components/CardType'
import { DaysEstimate } from '../../../components/AgilePlan'
import ParentSummary from '../ParentSummary'
import MarketLinks from '../MarketLinks'
import { useMetaDataStyles } from '../../Investible/Planning/PlanningInvestible'
import InsertLinkIcon from '@material-ui/icons/InsertLink'
import { navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import Collaborators from '../Collaborators'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import { attachFilesToMarket, deleteAttachedFilesFromMarket } from '../../../api/markets'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
import DialogBodyEdit from '../DialogBodyEdit'
import { doSetEditWhenValid } from '../../../utils/windowUtils'

const useStyles = makeStyles(theme => ({
  section: {
    alignItems: "flex-start",
    display: "flex",
    width: "50%"
  },
  collaborators: {
    backgroundColor: theme.palette.grey["300"],
    borderRadius: 6,
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(1, 1),
    "&:first-child": {
      marginLeft: 0
    },
    "& dt": {
      color: "#828282",
      fontSize: 10,
      fontWeight: "bold",
      marginBottom: theme.spacing(0.5)
    },
    "& dd": {
      fontSize: 20,
      margin: 0,
      lineHeight: "26px"
    },
    maxWidth: "60%",
    "& ul": {
      margin: 0,
      padding: 0
    },
    "& li": {
      display: "inline-flex",
      marginLeft: theme.spacing(1),
      "&:first-child": {
        marginLeft: 0
      }
    }
  },
  root: {
    alignItems: "flex-start",
    display: "flex",
    flexWrap: "wrap",
    overflow: "visible",
    justifyContent: "space-between"
  },
  actions: {
    justifyContent: 'flex-end',
    [theme.breakpoints.down("xs")]: {
      justifyContent: 'start'
    },
    '& > button': {
      marginRight: '-8px'
    }
  },
  editContent: {
    flexBasis: "100%",
    padding: theme.spacing(4, 1, 4, 1),
    [theme.breakpoints.down("xs")]: {
      padding: '15px'
    }
  },
  content: {
    flexBasis: "100%",
    padding: theme.spacing(4),
    [theme.breakpoints.down("xs")]: {
      padding: '15px'
    }
  },
  divider: {
    marginBottom: theme.spacing(3)
  },
  fieldset: {
    border: "none",
    display: "inline-block",
    padding: theme.spacing(0),
    "& > *": {
      marginLeft: theme.spacing(3),
      "&:first-child": {
        marginLeft: 0,
      }
    }
  },
  type: {
    display: "inline-flex"
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
    cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
    fontWeight: "bold",
    lineHeight: "42px",
    paddingBottom: "9px",
    [theme.breakpoints.down("xs")]: {
      fontSize: 25
    }
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
      paddingTop: '1rem',
      marginTop: '1rem',
      borderLeft: 'none',
      borderTop: '1px solid #e0e0e0',
      flexGrow: 'unset',
      maxWidth: 'unset',
      flexBasis: 'auto'
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
  fullWidth: {
    [theme.breakpoints.down("xs")]: {
      maxWidth: '100%',
      flexBasis: '100%'
    }
  },
  assignmentContainer: {
    width: '100%',
    textTransform: 'capitalize'
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
}));

function Summary(props) {
  const { market, investibleId, hidden, activeMarket, inArchives } = props;
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const {
    id,
    name,
    description,
    market_stage: marketStage,
    market_type: marketType,
    days_estimate: daysEstimate,
    parent_market_id: parentMarketId,
    parent_investible_id: parentInvestibleId,
    created_at: createdAt,
    attached_files: attachedFiles,
    locked_by: lockedBy,
    children,
  } = market;
  const [lastEdit, setLastEdit] = useState(undefined);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const marketPresences = getMarketPresences(marketPresencesState, id) || [];
  const isDraft = marketHasOnlyCurrentUser(marketPresencesState, id);
  const myPresence =
    marketPresences.find(presence => presence.current_user) || {};
  const metaClasses = useMetaDataStyles();
  const isAdmin = myPresence.is_admin;
  function isEditableByUser() {
    return isAdmin && !inArchives;
  }
  const [beingEdited, setBeingEdited] = useState(lockedBy === myPresence.id && isEditableByUser() ? id : undefined);
  function onAttachFile(metadatas) {
    return attachFilesToMarket(id, metadatas)
      .then((market) => {
        addMarketToStorage(marketsDispatch, diffDispatch, market, false);
      })
  }

  function onDeleteFile(path) {
    return deleteAttachedFilesFromMarket(id, [path])
      .then((market) => {
        addMarketToStorage(marketsDispatch, diffDispatch, market, false);
        return EMPTY_SPIN_RESULT;
      })
  }

  function mySetBeingEdited(isEdit, event) {
    doSetEditWhenValid(isEdit, isEditableByUser, setBeingEdited, id, event);
  }
  const myBeingEdited = beingEdited === id;
  return (
    <Card elevation={0} className={classes.root} id="summary">
      <CardType className={classes.type} type={AGILE_PLAN_TYPE} myBeingEdited={myBeingEdited} />
      <Grid container className={classes.mobileColumn}>
        <Grid item xs={9} className={classes.fullWidth}>
          <CardContent className={myBeingEdited ? classes.editContent : classes.content}>
            {isDraft && activeMarket && (
              <Typography className={classes.draft}>
                {intl.formatMessage({ id: "draft" })}
              </Typography>
            )}
            {!activeMarket && (
              <Typography className={classes.draft}>
                {intl.formatMessage({ id: "inactive" })}
              </Typography>
            )}
            {!myBeingEdited && (
              <>
                <Typography className={isEditableByUser() ? classes.titleEditable : classes.title} variant="h3" component="h1"
                            onClick={() => mySetBeingEdited(true)}>
                  {name}
                </Typography>
                <DescriptionOrDiff id={id} description={description} setBeingEdited={mySetBeingEdited}
                                   isEditable={isEditableByUser()} />
              </>
            )}
            {myBeingEdited && (
              <DialogBodyEdit hidden={hidden} setBeingEdited={mySetBeingEdited} marketId={id} />
            )}
          </CardContent>
        </Grid>
        <Grid className={classes.borderLeft} item xs={3}>
          <CardActions className={classes.actions}>
            <DialogActions
              isAdmin={isAdmin}
              isFollowing={myPresence.following}
              isGuest={myPresence.market_guest}
              marketStage={marketStage}
              marketType={marketType}
              parentMarketId={parentMarketId}
              parentInvestibleId={parentInvestibleId}
              marketId={id}
              initiativeId={investibleId}
            />
          </CardActions>
        <dl className={metaClasses.root}>
          {daysEstimate && (
            <fieldset className={classes.fieldset}>
              <DaysEstimate readOnly value={daysEstimate} createdAt={createdAt} />
            </fieldset>
          )}
        </dl>
        <dl className={metaClasses.root}>
          <div className={classes.assignmentContainer}>
            <FormattedMessage id="dialogParticipants" />
              <div className={clsx(classes.group, classes.assignments)}>
              <Collaborators
                marketPresences={marketPresences}
                intl={intl}
                marketId={id}
                history={history}
              />
            </div>
          </div>
          <ParentSummary market={market} hidden={hidden}/>
          <MarketLinks links={children || []} actions={inArchives ? [] : [<ExpandableAction
            id="link"
            key="link"
            icon={<InsertLinkIcon htmlColor={ACTION_BUTTON_COLOR} />}
            openLabel={intl.formatMessage({ id: "planningInvestibleDecision" })}
            label={intl.formatMessage({ id: "childDialogPlanningExplanation" })}
            onClick={() =>
              navigate(history, `/dialogAdd#type=${DECISION_TYPE}&id=${id}`)
            }
          />]} />
          <AttachedFilesList
            key="files"
            marketId={id}
            isAdmin={myPresence.is_admin}
            onDeleteClick={onDeleteFile}
            attachedFiles={attachedFiles}
            onUpload={onAttachFile} />

        </dl>
        </Grid>
      </Grid>
    </Card>
  );
}

Summary.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  investibleName: PropTypes.string,
  investibleDescription: PropTypes.string,
  investibleId: PropTypes.string,
  hidden: PropTypes.bool.isRequired,
  activeMarket: PropTypes.bool.isRequired,
  inArchives: PropTypes.bool.isRequired,
  unassigned: PropTypes.array
};

Summary.defaultProps = {
  investibleName: undefined,
  investibleDescription: undefined,
  investibleId: undefined,
  unassigned: []
};

export default Summary;
