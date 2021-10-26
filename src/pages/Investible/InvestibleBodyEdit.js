import React, { useContext, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
  import { lockInvestibleForEdit, realeaseInvestibleEditLock, updateInvestible, } from '../../api/investibles'
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { LockedDialog, useLockedDialogStyles } from '../Dialog/DialogBodyEdit'
import _ from 'lodash'
import { CardActions, CircularProgress, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import { processTextAndFilesForSave } from '../../api/files'
import { makeStyles } from '@material-ui/core/styles'
import NameField, { clearNameStoredState, getNameStoredState } from '../../components/TextFields/NameField'
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'
import { editorReset, useEditor } from '../../components/TextEditors/quillHooks';
import LockedDialogTitleIcon from '@material-ui/icons/Lock'
import { getQuillStoredState } from '../../components/TextEditors/QuillEditor2'
import IssueDialog from '../../components/Warnings/IssueDialog'

const useStyles = makeStyles(
  theme => ({
    actions: {
      marginTop: '1rem',
      [theme.breakpoints.between(601, 1400)]: {
        marginTop: '5rem',
      },
    },
    containerEditable: {
      cursor: 'url(\'/images/edit_cursor.svg\') 0 24, pointer',
      paddingLeft: '1.5rem'
    },
    container: {
      paddingLeft: '1.5rem'
    },
    title: {
      fontSize: 32,
      lineHeight: '42px',
      paddingBottom: '9px',
      [theme.breakpoints.down('sm')]: {
        fontSize: 25
      }
    }
  }),
  { name: "PlanningEdit" }
);

function InvestibleBodyEdit(props) {
  const { hidden, marketId, investibleId, isEditableByUser, userId, setBeingEdited,
    fullInvestible, pageState, pageStateUpdate, pageStateReset } = props;

  const {
    beingEdited,
    uploadedFiles,
    beingLocked,
    showDiff
  } = pageState;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [marketsState] = useContext(MarketsContext);
  const { investible: myInvestible } = fullInvestible;
  const { locked_by: lockedBy } = myInvestible;
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const loading = !beingEdited || !market;
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [openIssue, setOpenIssue] = useState(false);
  const { id, description: initialDescription, name: initialName } = myInvestible;

  const editorName = `${investibleId}-body-editor`;
  const useDescription = getQuillStoredState(editorName) || initialDescription;
  const editorSpec = {
    onUpload: (files) => pageStateUpdate({uploadedFiles: files}),
    marketId,
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault' }),
    value: useDescription
  };

  const [Editor, editorController] = useEditor(editorName, editorSpec);

  function handleSave() {
    const name = getNameStoredState(investibleId);
    if (_.isEmpty(name)) {
      setOperationRunning(false);
      setOpenIssue('nameRequired');
      return;
    }
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    const currentUploadedFiles = uploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...currentUploadedFiles, ...oldInvestibleUploadedFiles], 'path');
    const description = getQuillStoredState(editorName) !== null ? getQuillStoredState(editorName) : initialDescription;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name,
      description: tokensRemoved,
      marketId,
      investibleId: id,
    };
    return updateInvestible(updateInfo)
      .then((fullInvestible) => {
        setOperationRunning(false);
        editorController(editorReset());
        clearNameStoredState(investibleId);
        return onSave(fullInvestible);
      });
  }

  function onCancel () {
    pageStateReset();
    editorController(editorReset());
    return realeaseInvestibleEditLock(marketId, investibleId)
      .then((newInv) => {
        setOperationRunning(false);
        refreshInvestibles(investiblesDispatch, diffDispatch, [newInv]);
      });
  }

  function onSave (fullInvestible, stillEditing) {
    if (!stillEditing) {
      pageStateReset();
    }
    if (fullInvestible) {
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
    }
  }

  const classes = useStyles();
  const lockedDialogClasses = useLockedDialogStyles();

  function onLock (result) {
    if (result) {
      onSave(result, true);
    }
  }

  function takeoutLock () {
    pageStateUpdate({beingLocked: true});
    const breakLock = true;
    return lockInvestibleForEdit(marketId, investibleId, breakLock)
      .then((result) => {
        pageStateUpdate({beingLocked: false});
        setOperationRunning(false);
        return onLock(result);
      }).catch(() => {
        setOperationRunning(false);
        pageStateReset();
        editorController(editorReset());
      });
  }
  if (beingLocked) {
    return (
      <div align='center'>
        <Typography>{intl.formatMessage({ id: "gettingLockMessage" })}</Typography>
        <CircularProgress type="indeterminate"/>
      </div>
    );
  }
  if (!hidden && beingEdited && !loading) {
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
          open={!hidden && (someoneElseEditing)}
          onClose={onCancel}
          /* slots */
          actions={
            <SpinningIconLabelButton
              icon={LockedDialogTitleIcon}
              onClick={takeoutLock}
              id="pageLockEditButton"
            >
              <FormattedMessage
                id="pageLockEditPage"
              />
            </SpinningIconLabelButton>
          }
        />
        {(!lockedBy || (lockedBy === userId)) && (
          <>
            <NameField descriptionFunc={() => getQuillStoredState(editorName)} id={investibleId} />
            {Editor}
          </>
        )}
        <CardActions className={classes.actions}>
          <SpinningIconLabelButton onClick={onCancel} icon={Clear} id="marketAddCancelButton">
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton
            icon={SettingsBackupRestore}
            onClick={handleSave}
            id="investibleUpdateButton"
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
    <div onClick={(event) => !mobileLayout && setBeingEdited(true, event)}
         className={isEditableByUser() ? classes.containerEditable : classes.container}>
      <Typography className={classes.title} variant="h3" component="h1">
        {initialName}
      </Typography>
      <DescriptionOrDiff id={investibleId} description={initialDescription} showDiff={showDiff} />
    </div>
  );
}

InvestibleBodyEdit.propTypes = {
  hidden: PropTypes.bool,
  marketId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  setBeingEdited: PropTypes.func.isRequired,
  fullInvestible: PropTypes.object.isRequired
};

InvestibleBodyEdit.defaultProps = {
  hidden: false,
};

export default InvestibleBodyEdit;
