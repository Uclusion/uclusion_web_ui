import React, { useContext } from 'react'
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
import { CardActions, CircularProgress, Typography } from '@material-ui/core'
import { processTextAndFilesForSave } from '../../api/files'
import { makeStyles } from '@material-ui/core/styles'
import NameField from '../../components/TextFields/NameField'
import { isTinyWindow } from '../../utils/windowUtils'
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'
import { editorReset, useEditor } from '../../components/TextEditors/quillHooks';
import LockedDialogTitleIcon from '@material-ui/icons/Lock'
import { getQuillStoredState } from '../../components/TextEditors/QuillEditor2'

const useStyles = makeStyles(
  theme => ({
    actions: {
      marginTop: '1rem',
      [theme.breakpoints.between(601, 1400)]: {
        marginTop: '5rem',
      },
    },
    title: {
      fontSize: 32,
      lineHeight: "42px",
      paddingBottom: "9px",
      [theme.breakpoints.down("xs")]: {
        fontSize: 25
      }
    },
    titleEditable: {
      fontSize: 32,
      lineHeight: "42px",
      paddingBottom: "9px",
      cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
      [theme.breakpoints.down("xs")]: {
        fontSize: 25
      }
    },
  }),
  { name: "PlanningEdit" }
);

function InvestibleBodyEdit(props) {
  const { hidden, marketId, investibleId, isEditableByUser, userId, setBeingEdited,
    fullInvestible, pageState, pageStateUpdate, pageStateReset } = props;

  const {
    beingEdited,
    uploadedFiles,
    name,
    beingLocked,
    showDiff
  } = pageState;
  const intl = useIntl();
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
    setOperationRunning(true);
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    const currentUploadedFiles = uploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...currentUploadedFiles, ...oldInvestibleUploadedFiles], 'path');
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, getQuillStoredState(editorName));
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name: name,
      description: tokensRemoved,
      marketId,
      investibleId: id,
    };
    return updateInvestible(updateInfo)
      .then((fullInvestible) => {
        setOperationRunning(false);
        editorController(editorReset());
        return onSave(fullInvestible);
      });
  }

  function onCancel () {
    pageStateReset();
    editorController(editorReset());
    setOperationRunning(true);
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
    setOperationRunning(true);
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
        <LockedDialog
          classes={lockedDialogClasses}
          open={!hidden && (someoneElseEditing)}
          onClose={onCancel}
          /* slots */
          actions={
            <SpinningIconLabelButton
              icon={LockedDialogTitleIcon}
              onClick={takeoutLock}
            >
              <FormattedMessage
                id="pageLockEditPage"
              />
            </SpinningIconLabelButton>
          }
        />
        {(!lockedBy || (lockedBy === userId)) && (
          <>
            <NameField onEditorChange={(name) => pageStateUpdate({name})}
                       description={useDescription}
                       name={name}/>
            {Editor}
          </>
        )}
        <CardActions className={classes.actions}>
          <SpinningIconLabelButton onClick={onCancel} icon={Clear}>
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton
            disabled={!name}
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
      <Typography className={isEditableByUser() ? classes.titleEditable : classes.title} variant="h3" component="h1"
                  onClick={() => !isTinyWindow() && setBeingEdited(true)}>
        {initialName}
      </Typography>
      <DescriptionOrDiff id={investibleId} description={initialDescription} showDiff={showDiff}
                         setBeingEdited={isTinyWindow() ? () => {} : setBeingEdited}
                         isEditable={isEditableByUser()} />
    </>
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
