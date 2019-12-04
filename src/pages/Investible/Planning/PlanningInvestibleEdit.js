import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button, Card, CardActions, CardContent, TextField, withStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { updateInvestible as localUpdateInvestible } from '../../../contexts/InvestibesContext/investiblesContextReducer';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { processTextAndFilesForSave } from '../../../api/files';
import { getMarketInfo } from '../../../utils/userFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import AssignmentList from '../../Dialog/Planning/AssignmentList';

const styles = (theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  row: {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
});

function PlanningInvestibleEdit(props) {
  const {
    fullInvestible, intl, classes, onCancel, onSave, marketId,
  } = props;

  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const myInvestible = fullInvestible.investible;
  const marketInfo = getMarketInfo(fullInvestible, marketId);
  const { assigned, stage: currentStageId } = marketInfo;
  const { id, description: initialDescription } = myInvestible;
  const [currentValues, setCurrentValues] = useState(myInvestible);
  const [assignments, setAssignments] = useState(assigned);
  const { name } = currentValues;
  const initialUploadedFiles = myInvestible.uploaded_files || [];
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const [description, setDescription] = useState(initialDescription);
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const currentUser = getMyUserForMarket(marketsState, marketId);
  const marketStages = getStages(marketStagesState, marketId);
  // eslint-disable-next-line max-len
  const acceptedStage = marketStages.find((stage) => (!stage.allows_investment && stage.singular_only));
  // eslint-disable-next-line max-len
  const archivedStage = marketStages.find((stage) => (stage.appears_in_market_summary));

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function handleFileUpload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleSave() {
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    const newUploadedFiles = [...uploadedFiles, ...oldInvestibleUploadedFiles];
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
      assignments,
    };
    return updateInvestible(updateInfo)
      .then(() => {
        onSave();
      });
  }

  function handleStageChange(stage) {
    const stageInfo = {
      current_stage_id: currentStageId,
      stage_id: stage.id,
    };
    const acceptInfo = {
      marketId,
      investibleId: myInvestible.id,
      stageInfo,
    };
    return stageChangeInvestible(acceptInfo).then(() => onSave());
  }

  function handleArchived() {
    return handleStageChange(archivedStage);
  }

  function handleAccepted() {
    return handleStageChange(acceptedStage);
  }

  function handleAssignmentChange(newAssignments){
    setAssignments(newAssignments);
  }

  return (
    <Card>
      <CardContent>
        <AssignmentList
          marketId={marketId}
          previouslyAssigned={assigned}
          onChange={handleAssignmentChange}
        />
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'investibleEditTitleLabel' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
        <QuillEditor
          handleFileUpload={handleFileUpload}
          onChange={onEditorChange}
          defaultValue={description}
        />
      </CardContent>
      <CardActions>
        <Button onClick={onCancel}>
          {intl.formatMessage({ id: 'investibleEditCancelLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'investibleEditSaveLabel' })}
        </Button>
        {acceptedStage
        && currentStageId !== acceptedStage.id
        && currentUser
        && assignments.includes(currentUser.id) && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleAccepted}
        >
          {intl.formatMessage({ id: 'investibleEditAcceptLabel' })}
        </Button>
        )}
        {archivedStage
        && currentStageId !== archivedStage.id
        && currentUser
        && assignments.includes(currentUser.id) && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleArchived}
          >
            {intl.formatMessage({ id: 'investibleEditArchiveLabel' })}
          </Button>
        )}
      </CardActions>
    </Card>

  );
}

PlanningInvestibleEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

PlanningInvestibleEdit.defaultProps = {
  onSave: () => {},
  onCancel: () => {},
};
export default withStyles(styles)(injectIntl(PlanningInvestibleEdit));
