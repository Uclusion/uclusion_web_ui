import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'clsx'
import clsx from 'clsx'
import _ from 'lodash'
import localforage from 'localforage'
import {
  Button, Checkbox,
  darken,
  FormControlLabel,
  makeStyles,
  Paper,
} from '@material-ui/core'
import PropTypes from 'prop-types'
import QuillEditor from '../TextEditors/QuillEditor'
import { getMentionsFromText, saveComment } from '../../api/comments';
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
import {
  getBlockedStage,
  getInReviewStage,
  getRequiredInputStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { urlHelperGetName } from '../../utils/marketIdPathFunctions'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { changeInvestibleStageOnCommentChange } from '../../utils/commentFunctions'

function getPlaceHolderLabelId (type, isStory, isInReview) {
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
      if (isInReview) {
        return 'commentAddReviewReportDefault';
      }
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
    marketId, onSave, onCancel, type, clearType, investible, parent, hidden, issueWarningId, todoWarningId,
    isStory, defaultNotificationType, onDone, mentionsAllowed
  } = props;

  const intl = useIntl();

  const [body, setBody] = useState('');
  const [commentsState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [marketState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [openIssue, setOpenIssue] = useState(false);
  const classes = useStyles();
  const usedParent = parent || {};
  const { investible_id: parentInvestible, id: parentId } = usedParent;
  const investibleId = investible ? investible.id : parentInvestible;
  // TODO: this breaks if investible exists in more than one market
  const inv = getInvestible(investibleState, investibleId) || {};
  const { market_infos, investible: rootInvestible } = inv;
  const [info] = (market_infos || []);
  const { assigned, stage: currentStageId } = (info || {});
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {id: 'fake'};
  const placeHolderLabelId = getPlaceHolderLabelId(type, isStory, currentStageId === inReviewStage.id);
  const placeHolder = intl.formatMessage({ id: placeHolderLabelId });
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [firstOpen, setFirstOpen] = useState(true);
  const [placeHolderType, setPlaceHolderType] = useState(type);
  const [myNotificationType, setMyNotificationType] = useState(defaultNotificationType);

  //see https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react for why we have a func
  // that returns  func for editor funcs stored in state
  const [editorClearFunc, setEditorClearFunc] = useState(() => () => {});
  const [editorFocusFunc, setEditorFocusFunc] = useState(() => () => {});
  const [editorDefaultFunc, setEditorDefaultFunc] = useState(() => () => {});

  const [loadedId, setLoadedId] = useState(undefined);
  const loadId = investibleId ? `${marketId}_${investibleId}` :
    type === TODO_TYPE ? `${type}_${marketId}` : `${marketId}`;

  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};

  useEffect(() => {
    if (!hidden && loadedId !== loadId) {
      localforage.getItem(loadId).then((stateFromDisk) => {
        if (stateFromDisk) {
          setBody(stateFromDisk);
          editorDefaultFunc(stateFromDisk);
        }
        setLoadedId(loadId);
      });
    }
    return () => {};
  }, [hidden, loadedId, loadId, editorDefaultFunc]);

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
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, body);
    const mentions = getMentionsFromText(tokensRemoved);
    // the API does _not_ want you to send reply type, so suppress if our type is reply
    const apiType = (type === REPLY_TYPE) ? undefined : type;
    // what about not doing state?
    const blockingStage = getBlockedStage(marketStagesState, marketId) || {};
    const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
    const investibleRequiresInput = ((apiType === QUESTION_TYPE || apiType === SUGGEST_CHANGE_TYPE)
      && (assigned || []).includes(myPresence.id)) && currentStageId !== blockingStage.id
      && currentStageId !== requiresInputStage.id;
    const investibleBlocks = (investibleId && apiType === ISSUE_TYPE) && currentStageId !== blockingStage.id;
    return saveComment(marketId, investibleId, parentId, tokensRemoved, apiType, filteredUploads, mentions,
      myNotificationType)
      .then((comment) => {
        setMyNotificationType(undefined);
        changeInvestibleStageOnCommentChange(investibleBlocks, investibleRequiresInput,
          blockingStage, requiresInputStage, info, market_infos, rootInvestible, investibleDispatch);
        addCommentToMarket(comment, commentsState, commentDispatch);
        return EMPTY_SPIN_RESULT;
      });
  }

  function onStorageChange(value) {
    localforage.setItem(loadId, value).then(() => {});
  }

  function clearMe() {
    localforage.removeItem(loadId).then(() => {
      setBody('');
      editorClearFunc();
      setUploadedFiles([]);
      setOpenIssue(false);
      clearType();
    });
  }

  function myOnDone() {
    clearMe();
    onDone();
  }

  function handleCancel () {
    clearMe();
    onCancel();
  }

  function handleSpinStop () {
    clearMe();
    onSave();
  }

  function handleNotifyAllChange(event) {
    const { target: { checked } } = event;
    setMyNotificationType( checked ? 'YELLOW' : undefined);
  }

  const commentSaveLabel = parent ? 'commentAddSaveLabel' : 'commentReplySaveLabel';
  const commentCancelLabel = parent ? 'commentReplyCancelLabel' : 'commentAddCancelLabel';
  const showIssueWarning = (issueWarningId !== null && type === ISSUE_TYPE) ||
    (todoWarningId !== null && type === TODO_TYPE);
  const myWarningId = type === TODO_TYPE ? todoWarningId : issueWarningId;
  const lockedDialogClasses = useLockedDialogStyles();
  return (
    <>
      <Paper
        id={hidden ? '' : 'cabox'}
        className={(hidden) ? classes.hidden : classes.add}
        elevation={0}
      >
        <div className={classes.editor}>
          <QuillEditor
            participants={presences}
            marketId={marketId}
            placeholder={placeHolder}
            defaultValue={body}
            onChange={onEditorChange}
            onS3Upload={onS3Upload}
            onStoreChange={onStorageChange}
            setOperationInProgress={setOperationRunning}
            setEditorClearFunc={setEditorClearFunc}
            setEditorFocusFunc={setEditorFocusFunc}
            setEditorDefaultFunc={setEditorDefaultFunc}
            mentionsAllowed={mentionsAllowed}
            getUrlName={urlHelperGetName(marketState, investibleState)}
          >
            {!isStory && onDone && (
              <Button
                onClick={myOnDone}
                className={classes.button}
                style={{border: "1px solid black"}}
              >
                {intl.formatMessage({ id: 'cancel' })}
              </Button>
            )}
            <Button
              onClick={handleCancel}
              className={classes.button}
              style={{border: "1px solid black"}}
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
            {investible && type === REPORT_TYPE && (
              <FormControlLabel
                control={<Checkbox
                  id="notifyAll"
                  name="notifyAll"
                  checked={myNotificationType === 'YELLOW'}
                  onChange={handleNotifyAllChange}
                />}
                label={intl.formatMessage({ id: "notifyAll" })}
              />
            )}
            <Button className={classes.button}>
              {intl.formatMessage({ id: 'edited' })}
            </Button>
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
  investible: PropTypes.object,
  parent: PropTypes.object,
  onCancel: PropTypes.func,
  hidden: PropTypes.bool,
  clearType: PropTypes.func,
  isStory: PropTypes.bool,
  defaultNotificationType: PropTypes.string,
  mentionsAllowed: PropTypes.bool,
};

CommentAdd.defaultProps = {
  parent: null,
  investible: null,
  todoWarningId: null,
  defaultNotificationType: undefined,
  onCancel: () => {},
  clearType: () => {},
  hidden: false,
  isStory: false,
  mentionsAllowed: true,
};

export default CommentAdd;
