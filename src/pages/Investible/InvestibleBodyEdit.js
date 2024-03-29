import React, { useContext, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { lockInvestibleForEdit, realeaseInvestibleEditLock, updateInvestible, } from '../../api/investibles';
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { LockedDialog, useLockedDialogStyles } from '../Dialog/LockedDialog';
import _ from 'lodash';
import { CardActions, Typography } from '@material-ui/core';
import { processTextAndFilesForSave } from '../../api/files';
import { makeStyles } from '@material-ui/core/styles';
import NameField, { clearNameStoredState, getNameStoredState } from '../../components/TextFields/NameField';
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff';
import { Clear, SettingsBackupRestore } from '@material-ui/icons';
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton';
import { useEditor } from '../../components/TextEditors/quillHooks';
import LockedDialogTitleIcon from '@material-ui/icons/Lock';
import IssueDialog from '../../components/Warnings/IssueDialog';
import { getQuillStoredState, resetEditor } from '../../components/TextEditors/Utilities/CoreUtils';
import { PLANNING_TYPE } from '../../constants/markets';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';

export const useInvestibleEditStyles = makeStyles(
  theme => ({
    actions: {
      marginTop: '1rem'
    },
    containerEditable: {
      cursor: 'url(\'/images/edit_cursor.svg\') 0 24, pointer',
      [theme.breakpoints.down("sm")]: {
        paddingLeft: 'unset',
      }
    },
    container: {
      [theme.breakpoints.down("sm")]: {
        paddingLeft: 'unset',
      }
    },
    title: {
      fontSize: 28,
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
  const { hidden, marketId, investibleId, isEditableByUser, userId,
    fullInvestible, pageState, pageStateUpdate, pageStateReset } = props;

  const {
    beingEdited,
    uploadedFiles,
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
  const { market_type: marketType } = market;
  const isPlanning = marketType === PLANNING_TYPE;
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [openIssue, setOpenIssue] = useState(false);
  const { id, description: initialDescription, name: initialName } = myInvestible;

  const editorName = `body-editor${investibleId}`;
  const useDescription = getQuillStoredState(editorName) || initialDescription;
  const editorSpec = {
    onUpload: (files) => pageStateUpdate({uploadedFiles: files}),
    marketId,
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault' }),
    value: useDescription
  };

  const [Editor] = useEditor(editorName, editorSpec);

  function handleSave(event) {
    preventDefaultAndProp(event);
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
        resetEditor(editorName);
        clearNameStoredState(investibleId);
        return onSave(fullInvestible);
      });
  }

  function onCancel(event) {
    preventDefaultAndProp(event);
    pageStateReset();
    resetEditor(editorName);
    return realeaseInvestibleEditLock(marketId, investibleId).then((newInv) => {
      setOperationRunning(false);
      refreshInvestibles(investiblesDispatch, diffDispatch, [newInv]);
      if (isPlanning) {
        window.scrollTo(0, 0);
      }
    });
  }

  function onSave (fullInvestible, stillEditing) {
    if (!stillEditing) {
      pageStateReset();
      if (isPlanning) {
        window.scrollTo(0, 0);
      }
    }
    if (fullInvestible) {
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
    }
  }

  const classes = useInvestibleEditStyles();
  const lockedDialogClasses = useLockedDialogStyles();

  function onLock (result) {
    if (result) {
      onSave(result, true);
    }
  }

  function takeoutLock () {
    const breakLock = true;
    return lockInvestibleForEdit(marketId, investibleId, breakLock)
      .then((result) => {
        setOperationRunning(false);
        return onLock(result);
      }).catch(() => {
        setOperationRunning(false);
        pageStateReset();
        resetEditor(editorName);
      });
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
          onClose={() => {
            pageStateReset();
            resetEditor(editorName);
          }}
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
        <NameField editorName={editorName} id={investibleId} useCreateDefault/>
        {Editor}
        <CardActions className={classes.actions}>
          <SpinningIconLabelButton onClick={onCancel} icon={Clear} id="marketAddCancelButton">
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton
            icon={SettingsBackupRestore}
            onClick={handleSave}
            id="investibleUpdateButton"
          >
            <FormattedMessage id="update" />
          </SpinningIconLabelButton>
        </CardActions>
      </>
    );
  }
  return (
    <div className={isEditableByUser() ? classes.containerEditable : classes.container}>
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
  fullInvestible: PropTypes.object.isRequired
};

InvestibleBodyEdit.defaultProps = {
  hidden: false,
};

export default InvestibleBodyEdit;
