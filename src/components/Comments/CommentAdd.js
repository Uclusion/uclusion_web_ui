import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import classNames from 'clsx'
import clsx from 'clsx'
import _ from 'lodash'
import {
  Button, Card, CardContent,
  darken,
  FormControl,
  FormControlLabel,
  makeStyles,
  Paper,
  Radio,
  RadioGroup,
  Tooltip
} from '@material-ui/core'
import PropTypes from 'prop-types'
import QuillEditor from '../TextEditors/QuillEditor'
import { saveComment } from '../../api/comments'
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../constants/comments'
import { processTextAndFilesForSave } from '../../api/files'
import SpinBlockingButton from '../SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { addCommentToMarket } from '../../contexts/CommentsContext/commentsContextHelper'
import { Dialog } from '../Dialogs'
import WarningIcon from '@material-ui/icons/Warning'
import { useLockedDialogStyles } from '../../pages/Dialog/DialogBodyEdit'
import { EMPTY_SPIN_RESULT } from '../../constants/global'
import { getBlockedStage, getRequiredInputStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { addInvestible, getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { urlHelperGetName } from '../../utils/marketIdPathFunctions'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import CardType from '../CardType'

function getPlaceHolderLabelId (type, isStory) {
  switch (type) {
    case QUESTION_TYPE:
      if (isStory) {
        return 'commentAddStoryQuestionDefault';
      }
      return 'commentAddQuestionDefault';
    case SUGGEST_CHANGE_TYPE:
      return 'commentAddSuggestDefault';
    case ISSUE_TYPE:
      return 'commentAddIssueDefault';
    case REPLY_TYPE:
      return 'commentAddReplyDefault';
    case REPORT_TYPE:
      return 'commentAddReportDefault';
    case TODO_TYPE:
      return 'commentAddTODODefault';
    default:
      return 'commentAddSelectIssueLabel';
  }
}

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  hidden: {
    display: 'none',
  },
  add: {
    marginBottom: 16,
  },
  editor: {
    flex: 1,
    maxWidth: '100%'
  },
  button: {
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: 8,
    textTransform: 'capitalize',
  },
  buttonPrimary: {
    backgroundColor: '#2d9cdb',
    color: '#fff',
    '&:hover': {
      backgroundColor: darken('#2d9cdb', 0.08)
    },
    '&:focus': {
      backgroundColor: darken('#2d9cdb', 0.24)
    },
  },
  addBox: {},
  todoLabelType: {
    alignSelf: "start",
    display: "inline-flex"
  },
  commentType: {
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  },
  commentTypeGroup: {
    display: "flex",
    flexDirection: "row",
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
  },
  chipItem: {
    color: '#fff',
    borderRadius: '8px',
    '& .MuiChip-label': {
      fontSize: 12,
    },
    '& .MuiFormControlLabel-label': {
      paddingRight: '5px',
      fontWeight: 'bold',
      textTransform: 'capitalize',
      [theme.breakpoints.down('sm')]: {
        height: '100%',
        verticalAlign: 'middle',
        display: 'inline-block',
        '& .MuiSvgIcon-root': {
          display: 'block'
        }
      },
    },
    '& .MuiChip-avatar': {
      width: '16px',
      height: '14px',
      color: '#fff',
    },
    '& .MuiRadio-colorPrimary.Mui-checked':{
      '&.Mui-checked': {
        color: 'white'
      }
    },
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    margin: theme.spacing(0, 0, 0, 4),
    [theme.breakpoints.down('sm')]: {
      margin: '10px'
    },
  },
  selected: {
    opacity: 1
  },
  unselected: {
    opacity: '.6'
  },
  chipItemQuestion: {
    background: '#2F80ED',
  },
  chipItemIssue: {
    background: '#E85757',
    color: 'black'
  },
  chipItemSuggestion: {
    background: '#e6e969',
    color: 'black'
  },
  commentTypeContainer: {
    borderRadius: '4px 4px 0 0'
  }
}), { name: 'CommentAdd' });

function CommentAdd (props) {
  const {
    intl, marketId, onSave, onCancel, type, clearType, investible, parent, hidden, issueWarningId, todoWarningId,
    isStory, defaultNotificationType
  } = props;
  const [body, setBody] = useState('');
  const [commentsState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [marketState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [openIssue, setOpenIssue] = useState(false);
  const classes = useStyles();
  const placeHolderLabelId = getPlaceHolderLabelId(type, isStory);
  const placeHolder = intl.formatMessage({ id: placeHolderLabelId });
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [firstOpen, setFirstOpen] = useState(true);
  const [placeHolderType, setPlaceHolderType] = useState(type);
  const [myNotificationType, setMyNotificationType] = useState(defaultNotificationType);
  const defaultClearFunc = (newPlaceHolder) => {};
  //see https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react for why we have a func
  // that returns  func for editorClearFunc
  const [editorClearFunc, setEditorClearFunc] = useState(() => defaultClearFunc);
  const defaultFocusFunc = () => {};
  const [editorFocusFunc, setEditorFocusFunc] = useState(() => defaultFocusFunc);

  useEffect(() => {
    if (!hidden && firstOpen) {
      editorFocusFunc();
      setFirstOpen(false);
    }
    if (hidden && !firstOpen) {
      setFirstOpen(true);
    }
    if (_.isEmpty(body) && type !== placeHolderType) {
      if (_.isEmpty(placeHolderType)) {
        editorFocusFunc();
      }
      setPlaceHolderType(type);
      editorClearFunc(placeHolder);
    }
    return () => {};
  }, [hidden, firstOpen, editorFocusFunc, body, type, placeHolderType, placeHolder, editorClearFunc]);

  function onEditorChange (content) {
    setBody(content);
  }

  function toggleIssue () {
    setOpenIssue(!openIssue);
  }

  function onS3Upload (metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleSave () {
    const usedParent = parent || {};
    const { investible_id: parentInvestible, id: parentId } = usedParent;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, body);
    // the API does _not_ want you to send reply type, so suppress if our type is reply
    const apiType = (type === REPLY_TYPE) ? undefined : type;
    const investibleId = (investible) ? investible.id : parentInvestible;
    // what about not doing state?
    const investibleBlocks = (investibleId && apiType === ISSUE_TYPE);
    // TODO: this breaks if investible exists in more than one market
    const inv = getInvestible(investibleState, investibleId) || {};
    const { market_infos, investible: rootInvestible } = inv;
    const [info] = (market_infos || []);
    const presences = getMarketPresences(marketPresencesState, marketId) || [];
    const myPresence = presences.find((presence) => presence.current_user) || {};
    const { assigned } = (info || {});
    const investibleRequiresInput = ((apiType === QUESTION_TYPE || apiType === SUGGEST_CHANGE_TYPE)
      && (assigned || []).includes(myPresence.id));
    const myActualNotificationType = type === TODO_TYPE && !investibleId ? myNotificationType : undefined;
    return saveComment(marketId, investibleId, parentId, tokensRemoved, apiType, filteredUploads,
      myActualNotificationType)
      .then((comment) => {
        // move the investible to other state if necessary
        if (investibleBlocks || investibleRequiresInput) {
          const blockingStage = getBlockedStage(marketStagesState, marketId);
          const requiresInputStage = getRequiredInputStage(marketStagesState, marketId);
          const newStage = investibleBlocks ? blockingStage : requiresInputStage;
          if (newStage) {
            const newInfo = {
              ...info,
              stage: newStage.id,
              stage_name: newStage.name,
              open_for_investment: false,
              last_stage_change_date: Date.now().toString(),
            };
            const newInfos = _.unionBy([newInfo], market_infos, 'id');
            const newInvestible = {
              investible: rootInvestible,
              market_infos: newInfos
            };
            // no diff here, so no diff dispatch
            addInvestible(investibleDispatch, ()=> {}, newInvestible);
          }
        }
        addCommentToMarket(comment, commentsState, commentDispatch);
        return EMPTY_SPIN_RESULT;
      });
  }

  function handleCancel () {
    setBody('');
    editorClearFunc();
    setUploadedFiles([]);
    setOpenIssue(false);
    onCancel();
    clearType();
  }

  function handleSpinStop () {
    setBody('');
    editorClearFunc();
    setUploadedFiles([]);
    setOpenIssue(false);
    onSave();
    clearType();
  }
  function onNotificationTypeChange(event) {
    const { value } = event.target;
    setMyNotificationType(value);
  }
  const commentSaveLabel = parent ? 'commentAddSaveLabel' : 'commentReplySaveLabel';
  const commentCancelLabel = parent ? 'commentReplyCancelLabel' : 'commentAddCancelLabel';
  const showIssueWarning = (issueWarningId !== null && type === ISSUE_TYPE) ||
    (todoWarningId !== null && type === TODO_TYPE);
  const myWarningId = type === TODO_TYPE ? todoWarningId : issueWarningId;
  const lockedDialogClasses = useLockedDialogStyles();
  return (
    <>
      {type === TODO_TYPE && !investible && (
        <Card elevation={0} className={classes.commentTypeContainer}>
          <CardType className={classes.todoLabelType} type={type} resolved={false} />
          <CardContent>
            <FormControl component="fieldset" className={classes.commentType}>
              <RadioGroup
                aria-labelledby="notification-type-choice"
                className={classes.commentTypeGroup}
                onChange={onNotificationTypeChange}
                value={myNotificationType}
                row
              >
                {['RED', 'YELLOW', 'BLUE'].map((notificationType) => {
                  return (
                    <Tooltip key={`tip${notificationType}`}
                             title={<FormattedMessage id={`${notificationType.toLowerCase()}Tip`} />}>
                      <FormControlLabel
                        id={`commentAddNotificationType${notificationType}`}
                        key={notificationType}
                        className={clsx(
                          notificationType === 'RED' ? `${classes.chipItem} ${classes.chipItemIssue}`
                            : notificationType === 'BLUE' ? `${classes.chipItem} ${classes.chipItemQuestion}`
                            : `${classes.chipItem} ${classes.chipItemSuggestion}`,
                          myNotificationType === notificationType ? classes.selected : classes.unselected
                        )}
                        /* prevent clicking the label stealing focus */
                        onMouseDown={e => e.preventDefault()}
                        control={<Radio color="primary" />}
                        label={<FormattedMessage id={`notificationLabel${notificationType}`} />}
                        labelPlacement="end"
                        value={notificationType}
                      />
                    </Tooltip>
                  );
                })}
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>
      )}
      <Paper
        id={hidden ? '' : 'cabox'}
        className={(hidden) ? classes.hidden : classes.add}
        elevation={0}
      >
        <div className={classes.editor}>
          <QuillEditor
            marketId={marketId}
            placeholder={placeHolder}
            defaultValue={body}
            onChange={onEditorChange}
            onS3Upload={onS3Upload}
            setOperationInProgress={setOperationRunning}
            setEditorClearFunc={(func) => {
              setEditorClearFunc(func);
            }}
            setEditorFocusFunc={(func) => {
              // console.log('Setting focus func');
              setEditorFocusFunc(func);
            }}
            getUrlName={urlHelperGetName(marketState, investibleState)}
          >
            <Button
              onClick={handleCancel}
              className={classes.button}
            >
              {intl.formatMessage({ id: commentCancelLabel })}
            </Button>
            {!showIssueWarning && (
              <SpinBlockingButton
                className={classNames(classes.button, classes.buttonPrimary)}
                marketId={marketId}
                onClick={handleSave}
                onSpinStop={handleSpinStop}
                disabled={_.isEmpty(body) || _.isEmpty(type)}
                hasSpinChecker
              >
                {intl.formatMessage({ id: commentSaveLabel })}
              </SpinBlockingButton>
            )}
            {showIssueWarning && (
              <Button className={classNames(classes.button, classes.buttonPrimary)} onClick={toggleIssue}>
                {intl.formatMessage({ id: commentSaveLabel })}
              </Button>
            )}
            {myWarningId && (
              <IssueDialog
                classes={lockedDialogClasses}
                open={!hidden && openIssue}
                onClose={toggleIssue}
                issueWarningId={myWarningId}
                /* slots */
                actions={
                  <SpinBlockingButton
                    className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
                    disableFocusRipple
                    marketId={marketId}
                    onClick={handleSave}
                    onSpinStop={handleSpinStop}
                    disabled={_.isEmpty(body)}
                    hasSpinChecker
                  >
                    <FormattedMessage id="issueProceed" />
                  </SpinBlockingButton>
                }
              />
            )}
          </QuillEditor>
        </div>
      </Paper>
    </>
  );
}

function IssueDialog(props) {
  const { actions, classes, open, onClose, issueWarningId } = props;

  const autoFocusRef = React.useRef(null);

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.issueWarningContent,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <React.Fragment>
          {actions}
          <Button
            className={clsx(classes.action, classes.actionCancel)}
            disableFocusRipple
            onClick={onClose}
            ref={autoFocusRef}
          >
            <FormattedMessage id="lockDialogCancel" />
          </Button>
        </React.Fragment>
      }
      content={<FormattedMessage id={issueWarningId} />}
      title={
        <React.Fragment>
          <WarningIcon className={classes.warningTitleIcon} />
          <FormattedMessage id="warning" />
        </React.Fragment>
      }
    />
  );
}

IssueDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  issueWarningId: PropTypes.string.isRequired,
};

CommentAdd.propTypes = {
  type: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  issueWarningId: PropTypes.string,
  todoWarningId: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  parent: PropTypes.object,
  onCancel: PropTypes.func,
  hidden: PropTypes.bool,
  clearType: PropTypes.func,
  isStory: PropTypes.bool,
  defaultNotificationType: PropTypes.string
};

CommentAdd.defaultProps = {
  parent: null,
  investible: null,
  todoWarningId: null,
  defaultNotificationType: 'BLUE',
  onCancel: () => {},
  clearType: () => {},
  hidden: false,
  isStory: false
};

export default injectIntl(CommentAdd);
