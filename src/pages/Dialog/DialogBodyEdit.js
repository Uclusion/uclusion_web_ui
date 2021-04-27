import React, { useContext } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import localforage from 'localforage'
import { darken, makeStyles } from '@material-ui/core/styles'
import LockedDialogTitleIcon from '@material-ui/icons/Lock'
import _ from 'lodash'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper'
import { PLANNING_TYPE } from '../../constants/markets'
import { lockPlanningMarketForEdit, unlockPlanningMarketForEdit, updateMarket } from '../../api/markets'
import { Dialog } from '../../components/Dialogs'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { CardActions, CircularProgress, Typography } from '@material-ui/core'
import { processTextAndFilesForSave } from '../../api/files'
import NameField from '../../components/TextFields/NameField'
import { isTinyWindow } from '../../utils/windowUtils'
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'
import { useEditor, editorReset } from '../../components/TextEditors/quillHooks';
import WarningIcon from '@material-ui/icons/Warning'

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
        [theme.breakpoints.down("xs")]: {
          fontSize: 25
        }
      },
      titleEditable: {
        fontSize: 32,
        cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
        lineHeight: "42px",
        paddingBottom: "9px",
        [theme.breakpoints.down("xs")]: {
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
      margin: theme.spacing(0, 0, 0, 0)
    },
  }),
  { name: "DialogEdit" }
);

function DialogBodyEdit(props) {
  const { hidden, setBeingEdited, market, isEditableByUser, userId, pageState, pageStateUpdate,
    pageStateReset} = props;
  const {
    beingEdited,
    uploadedFiles,
    description,
    name,
    beingLocked,
    showDiff
  } = pageState;
  const intl = useIntl();
  const classes = useStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [,marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const { id, name: initialName, description: initialDescription,
    market_type: marketType, locked_by: lockedBy } = market;
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);

  const editorName = `${id}-body-editor`;
  const editorSpec = {
    onUpload: (files) => pageStateUpdate({uploadedFiles: files}),
    marketId: id,
    onChange: (contents) => pageStateUpdate({description: contents}),
    dontManageState: true, // handled by the page
    value: description,
  };

  const [Editor, editorController] = useEditor(editorName, editorSpec);

  function handleSave() {
    setOperationRunning(true);
    // the set of files for the market is all the old files, plus our new ones
    const oldMarketUploadedFiles = market.uploaded_files || [];
    const currentUploadedFiles = uploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...currentUploadedFiles, ...oldMarketUploadedFiles], 'path');
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updatedFilteredUploads = _.isEmpty(uploadedFiles) ? filteredUploads : null;
    return updateMarket(id, name, tokensRemoved, updatedFilteredUploads)
      .then((market) => {
        //clear the editor because we want the storage back
        editorController(editorReset());
        setOperationRunning(false);
        onSave(market);
      });
  }

  function onCancel() {
    pageStateReset();
    editorController(editorReset());
    if (marketType === PLANNING_TYPE) {
      setOperationRunning(true);
      return unlockPlanningMarketForEdit(id).then((market) => {
        setOperationRunning(false);
        updateMarketInStorage(market);
      });
    }
  }

  function updateMarketInStorage(market) {
    const diffSafe = {
      ...market,
      updated_by: userId,
      updated_by_you: true,
    };
    addMarketToStorage(marketsDispatch, diffDispatch, diffSafe, false);
  }

  function onSave(market) {
    setBeingEdited(false);
    updateMarketInStorage(market);
    return localforage.removeItem(id);
  }
  function myOnClick() {
    pageStateUpdate({beingLocked: true});
    const breakLock = true;
    setOperationRunning(true);
    return lockPlanningMarketForEdit(id, breakLock)
      .then((result) => {
        pageStateUpdate({beingLocked: false});
        setOperationRunning(false);
        updateMarketInStorage(result);
      }).catch(() => {
        setOperationRunning(false);
        pageStateReset();
        editorController(editorReset());
      });
  }

  const lockedDialogClasses = useLockedDialogStyles();

  if (beingLocked) {
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
        <LockedDialog
          classes={lockedDialogClasses}
          open={!hidden && someoneElseEditing}
          onClose={onCancel}
          /* slots */
          actions={
            <SpinningIconLabelButton onClick={myOnClick} icon={LockedDialogTitleIcon}>
              {intl.formatMessage({ id: 'pageLockEditPage' })}
            </SpinningIconLabelButton>
          }
        />
        {(!lockedBy || (lockedBy === userId)) && (
          <>
            <NameField onEditorChange={(name) => pageStateUpdate({name})}
                       description={description}
                       name={name} label="agilePlanFormTitleLabel" placeHolder="decisionTitlePlaceholder"
                       id="decision-name" />
            {Editor}
          </>
        )}
        <CardActions className={classes.actions}>
          <SpinningIconLabelButton onClick={onCancel} doSpin={marketType === PLANNING_TYPE} icon={Clear}>
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton
            icon={SettingsBackupRestore}
            onClick={handleSave}
          >
            <FormattedMessage
              id="agilePlanFormSaveLabel"
            />
          </SpinningIconLabelButton>
        </CardActions>
      </>
    );
  }

  return (
    <>
      <Typography className={isEditableByUser() ? lockedDialogClasses.titleEditable :
        lockedDialogClasses.titleDisplay}
                  variant="h3" component="h1"
                  onClick={() => !isTinyWindow() && setBeingEdited(true)}>
        {initialName}
      </Typography>
      <DescriptionOrDiff id={id} description={initialDescription} showDiff={showDiff}
                         setBeingEdited={isTinyWindow() ? () => {} : setBeingEdited}
                         isEditable={isEditableByUser()}/>
    </>
  );
}

DialogBodyEdit.propTypes = {
  hidden: PropTypes.bool.isRequired,
  market: PropTypes.object.isRequired,
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
