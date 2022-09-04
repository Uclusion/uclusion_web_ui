import React, { useContext, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import localforage from 'localforage'
import { darken, makeStyles } from '@material-ui/core/styles'
import LockedDialogTitleIcon from '@material-ui/icons/Lock'
import _ from 'lodash'
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper'
import { lockGroupForEdit, unlockGroupForEdit, updateGroup } from '../../api/markets';
import { Dialog } from '../../components/Dialogs'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { CardActions, CircularProgress, Typography } from '@material-ui/core'
import { processTextAndFilesForSave } from '../../api/files'
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'
import { useEditor } from '../../components/TextEditors/quillHooks';
import WarningIcon from '@material-ui/icons/Warning'
import IssueDialog from '../../components/Warnings/IssueDialog'
import { getQuillStoredState } from '../../components/TextEditors/Utilities/CoreUtils';
import { LOCK_GROUP } from '../../contexts/MarketGroupsContext/marketGroupsContextMessages'
import { addGroupToStorage } from '../../contexts/MarketGroupsContext/marketGroupsContextHelper'
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext'

export const useLockedDialogStyles = makeStyles(
  (theme) => {
    return {
      root: {
        '& .MuiDialogTitle-root': {
          flex: '0 0 auto',
          margin: 0,
          padding: '16px 24px 0px 24px'
        },
      },
      title: {
        fontWeight: 'bold',
        textTransform: "capitalize",
        display: "flex",
        justifyContent: "center",
        "& h2": {
          display: "flex",
          alignItems: "center"
        }
      },
      titleIcon: {
        height: 16,
        width: 16,
        marginRight: 8,
      },
      titleDisplay: {
        fontSize: 32,
        lineHeight: "42px",
        paddingBottom: "9px",
        [theme.breakpoints.down("sm")]: {
          fontSize: 25
        }
      },
      titleEditable: {
        fontSize: 32,
        cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
        lineHeight: "42px",
        paddingBottom: "9px",
        [theme.breakpoints.down("sm")]: {
          fontSize: 25
        }
      },
      warningTitleIcon: {
        marginRight: 8,
        color: '#F2C94C',
      },
      content: {
        lineHeight: 1.75,
        textAlign: "center"
      },
      issueWarningContent: {
        lineHeight: 3,
        minWidth: '35rem',
        textAlign: "center"
      },
      actions: {
        flexBasis: "unset",
        justifyContent: "center"
      },
      action: {
        color: 'white',
        fontWeight: 'bold',
        paddingLeft: 24,
        paddingRight: 24,
        textTransform: "capitalize"
      },
      actionEdit: {
        backgroundColor: "#2D9CDB",
        "&:hover": {
          backgroundColor: darken("#2D9CDB", 0.08)
        },
        "&:focus": {
          backgroundColor: darken("#2D9CDB", 0.24)
        },
      },
      actionCancel: {
        backgroundColor: "#8C8C8C",
        "&:hover": {
          backgroundColor: darken("#8C8C8C", 0.04)
        },
        "&:focus": {
          backgroundColor: darken("#8C8C8C", 0.12)
        },
      }
    };
  },
  { name: "LockedDialog" }
);

const useStyles = makeStyles(
  theme => ({
    actions: {
      marginTop: '1rem',
      [theme.breakpoints.between(601, 1400)]: {
        marginTop: '5rem',
      },
    },
  }),
  { name: "DialogEdit" }
);

function DialogBodyEdit(props) {
  const { hidden, setBeingEdited, group, userId, pageState, pageStateUpdate, pageStateReset} = props;
  const {
    beingEdited,
    uploadedFiles,
    showDiff
  } = pageState;
  const intl = useIntl();
  const classes = useStyles();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [openIssue, setOpenIssue] = useState(false);
  const { id, description: initialDescription, locked_by: lockedBy, market_id: marketId } = group;
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);

  const editorName = `${id}-body-editor`;
  const useDescription = getQuillStoredState(editorName) || initialDescription;
  const editorSpec = {
    onUpload: (files) => pageStateUpdate({uploadedFiles: files}),
    marketId: id,
    value: useDescription,
  };

  const [Editor, editorReset] = useEditor(editorName, editorSpec);

  function handleSave() {
    // the set of files for the market is all the old files, plus our new ones
    const oldMarketUploadedFiles = group.uploaded_files || [];
    const currentUploadedFiles = uploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...currentUploadedFiles, ...oldMarketUploadedFiles], 'path');
    const description = getQuillStoredState(editorName) !== null ? getQuillStoredState(editorName) : initialDescription;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updatedFilteredUploads = _.isEmpty(uploadedFiles) ? filteredUploads : null;
    return updateGroup(marketId, id, null, tokensRemoved, updatedFilteredUploads)
      .then((group) => {
        //clear the editor because we want the storage back
        editorReset();
        setOperationRunning(false);
        return onSave(group);
      });
  }

  function onCancel() {
    pageStateReset();
    editorReset();
    return unlockGroupForEdit(id).then((group) => {
      setOperationRunning(false);
      updateGroupInStorage(group);
    });
  }

  function updateGroupInStorage(group) {
    const diffSafe = {
      ...group,
      updated_by: userId,
      updated_by_you: true,
    };
    addGroupToStorage(groupsDispatch, diffDispatch, marketId, diffSafe);
  }

  function onSave(group) {
    setBeingEdited(false);
    updateGroupInStorage(group);
    return localforage.removeItem(id);
  }
  function myOnClick() {
    const breakLock = true;
    return lockGroupForEdit(marketId, id, breakLock)
      .then((result) => {
        setOperationRunning(false);
        updateGroupInStorage(result);
      }).catch(() => {
        setOperationRunning(false);
        pageStateReset();
        editorReset();
      });
  }

  const lockedDialogClasses = useLockedDialogStyles();

  if (beingEdited && lockedBy !== userId && operationRunning === LOCK_GROUP) {
    return (
      <div align='center'>
        <Typography>{intl.formatMessage({ id: "gettingLockMessage" })}</Typography>
        <CircularProgress type="indeterminate"/>
      </div>
    );
  }

  if (!hidden && beingEdited) {
    return (
      <>
        {openIssue !== false && (
          <IssueDialog
            classes={lockedDialogClasses}
            open={openIssue !== false}
            onClose={() => setOpenIssue(false)}
            issueWarningId={openIssue}
            showDismiss={false}
          />
        )}
        <LockedDialog
          classes={lockedDialogClasses}
          open={!hidden && someoneElseEditing}
          onClose={onCancel}
          /* slots */
          actions={
            <SpinningIconLabelButton onClick={myOnClick} icon={LockedDialogTitleIcon} id="pageLockEditPageButton">
              {intl.formatMessage({ id: 'pageLockEditPage' })}
            </SpinningIconLabelButton>
          }
        />
        <Typography variant="h6" style={{marginTop: 0, paddingTop: 0}}>
          {intl.formatMessage({ id: 'groupDiscussionDesc' })}
        </Typography>
        {Editor}
        <CardActions className={classes.actions}>
          <SpinningIconLabelButton onClick={onCancel} doSpin={true} icon={Clear} id="marketAddCancelButton">
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton
            icon={SettingsBackupRestore}
            onClick={handleSave}
            id="agilePlanFormSaveButton"
          >
            <FormattedMessage id="update" />
          </SpinningIconLabelButton>
        </CardActions>
      </>
    );
  }

  return (
    <>
      <Typography variant="h6">
        {intl.formatMessage({ id: 'groupDiscussionDesc' })}
      </Typography>
      <DescriptionOrDiff id={id} description={initialDescription} showDiff={showDiff} />
    </>
  );
}

DialogBodyEdit.propTypes = {
  hidden: PropTypes.bool.isRequired,
  group: PropTypes.object.isRequired,
  userId: PropTypes.string.isRequired
};

export function LockedDialog(props) {
  const { actions, classes, open, onClose } = props;

  const autoFocusRef = React.useRef(null);

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.content,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <React.Fragment>
          <SpinningIconLabelButton onClick={onClose} doSpin={false} icon={Clear} ref={autoFocusRef}>
            <FormattedMessage id="lockDialogCancel" />
          </SpinningIconLabelButton>
          {actions}
        </React.Fragment>
      }
      content={<FormattedMessage id="lockDialogContent" />}
      title={
        <React.Fragment>
          <WarningIcon className={classes.warningTitleIcon} />
          <FormattedMessage id="lockDialogTitle" />
        </React.Fragment>
      }
    />
  );
}

LockedDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default DialogBodyEdit;
