import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import localforage from 'localforage'
import Button from '@material-ui/core/Button'
import { darken, makeStyles } from '@material-ui/core/styles'
import LockedDialogTitleIcon from '@material-ui/icons/Lock'
import clsx from 'clsx'
import _ from 'lodash'
import { urlHelperGetName, } from '../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper'
import { PLANNING_TYPE } from '../../constants/markets'
import { lockPlanningMarketForEdit, unlockPlanningMarketForEdit, updateMarket } from '../../api/markets'
import { Dialog } from '../../components/Dialogs'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { CardActions, CircularProgress, Typography } from '@material-ui/core'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { processTextAndFilesForSave } from '../../api/files'
import NameField from '../../components/TextFields/NameField'
import { isTinyWindow } from '../../utils/windowUtils'
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'

export const useLockedDialogStyles = makeStyles(
  (theme) => {
    return {
      title: {
        backgroundColor: "#F2C94C",
        fontWeight: 'bold',
        textTransform: "capitalize",
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
      },
      content: {
        lineHeight: 1.75,
        textAlign: "center"
      },
      issueWarningContent: {
        lineHeight: 3,
        textAlign: "center"
      },
      actions: {
        backgroundColor: "#F2F2F2",
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
      margin: theme.spacing(9, 0, 0, 0)
    },
  }),
  { name: "DialogEdit" }
);

function DialogBodyEdit(props) {
  const { hidden, setBeingEdited, market, isEditableByUser, beingEdited, loaded, userId } = props;
  const { description: storedDescription, name: storedName } = loaded || {};
  const intl = useIntl();
  const classes = useStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const { id, name: initialName, description: initialDescription,
    market_type: marketType, locked_by: lockedBy } = market;
  const loading = !marketType;
  const [lockFailed, setLockFailed] = useState(false);
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [name, setName] = useState(loaded !== undefined ? storedName : initialName);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [description, setDescription] = useState(loaded !== undefined ? storedDescription : initialDescription);
  
  useEffect(() => {
    if (!hidden && beingEdited) {
      if (marketType === PLANNING_TYPE && !loading && _.isEmpty(lockedBy) && !lockFailed) {
        lockPlanningMarketForEdit(id)
          .then((market) => addMarketToStorage(marketsDispatch, () => {}, market))
          .catch(() => setLockFailed(true));
      }
    }
    return () => {};
  }, [hidden, marketType, loading, lockFailed, id, marketsDispatch, lockedBy, beingEdited]);

  function handleSave() {
    setOperationRunning(true);
    // the set of files for the market is all the old files, plus our new ones
    const oldMarketUploadedFiles = market.uploaded_files || [];
    const newUploadedFiles = _.uniqBy([...uploadedFiles, ...oldMarketUploadedFiles], 'path');
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updatedFilteredUploads = _.isEmpty(uploadedFiles) ? filteredUploads : null;
    return updateMarket(id, name, tokensRemoved, updatedFilteredUploads, null,
      null, null, null, null)
      .then((market) => {
        setOperationRunning(false);
        onSave(market);
      });
  }

  function onCancel() {
    setBeingEdited(false);
    if (marketType === PLANNING_TYPE) {
      unlockPlanningMarketForEdit(id).then((market) => updateMarketInStorage(market));
    }
    return localforage.removeItem(id);
  }

  function updateMarketInStorage(market) {
    const diffSafe = {
      ...market,
      updated_by: userId,
      updated_by_you: true,
    };
    addMarketToStorage(marketsDispatch, diffDispatch, diffSafe);
  }

  function onSave(market) {
    setBeingEdited(false);
    updateMarketInStorage(market);
    return localforage.removeItem(id);
  }
  function myOnClick() {
    const breakLock = true;
    return lockPlanningMarketForEdit(id, breakLock)
      .then((result) => {
        return {
          result,
          spinChecker: () => Promise.resolve(true),
        };
      })
      .catch(() => {
        return {
          result: false,
          spinChecker: () => Promise.resolve(true),
        };
      });
  }
  function onLock(result) {
    if (result) {
      updateMarketInStorage(result);
    }
    setLockFailed(!result);
  }

  const lockedDialogClasses = useLockedDialogStyles();

  function handleNameChange(value) {
    setName(value);
  }

  function handleNameStorage(value) {
    handleDraftState({ description, name: value });
  }

  function handleDraftState(newDraftState) {
    localforage.setItem(id, newDraftState).then(() => {});
  }

  function onEditorChange(content) {
    setDescription(content);
  }

  function onStorageChange(description) {
    handleDraftState({ name, description });
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  if (!hidden && beingEdited) {
    return (
      <>
        <LockedDialog
          classes={lockedDialogClasses}
          open={!hidden && (someoneElseEditing || lockFailed)}
          onClose={onCancel}
          /* slots */
          actions={
            <SpinBlockingButton
              className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
              disableFocusRipple
              marketId={id}
              onClick={myOnClick}
              onSpinStop={onLock}
              hasSpinChecker
              disabled={operationRunning}
            >
              <FormattedMessage id="pageLockEditPage" />
            </SpinBlockingButton>
          }
        />
        {(!lockedBy || (lockedBy === userId)) && (
          <>
            <NameField onEditorChange={handleNameChange} onStorageChange={handleNameStorage}
                       description={description}
                       name={name} label="agilePlanFormTitleLabel" placeHolder="decisionTitlePlaceholder"
                       id="decision-name" />
            <QuillEditor
              onChange={onEditorChange}
              onStoreChange={onStorageChange}
              defaultValue={description}
              marketId={id}
              onS3Upload={onS3Upload}
              setOperationInProgress={setOperationRunning}
              getUrlName={urlHelperGetName(marketsState, investiblesState)}
            />
          </>
        )}
        {(lockedBy && (lockedBy !== userId)) && (
          <div align='center'>
            <Typography>{intl.formatMessage({ id: "gettingLockMessage" })}</Typography>
            <CircularProgress type="indeterminate"/>
          </div>
        )}
        <CardActions className={classes.actions}>
          <SpinningIconLabelButton onClick={onCancel} doSpin={false} icon={Clear}>
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
      <DescriptionOrDiff id={id} description={initialDescription}
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
      content={<FormattedMessage id="lockDialogContent" />}
      title={
        <React.Fragment>
          <LockedDialogTitleIcon className={classes.titleIcon} />
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
