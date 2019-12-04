import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button, Card, CardActions, CardContent, TextField, withStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { updateInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { submitToModerator } from '../../../api/marketInvestibles';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getFlags } from '../../../utils/userFunctions';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { updateInvestible as localUpdateInvestible } from '../../../contexts/InvestibesContext/investiblesContextReducer';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { processTextAndFilesForSave } from '../../../api/files';

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

function DecisionInvestibleEdit(props) {
  const {
    fullInvestible, intl, classes, onCancel, onSave, marketId,
    isAdmin,
  } = props;

  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const myInvestible = fullInvestible.investible;
  const { id, description: initialDescription } = myInvestible;
  const [currentValues, setCurrentValues] = useState(myInvestible);
  const { name } = currentValues;
  const initialUploadedFiles = myInvestible.uploaded_files || [];
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const [description, setDescription] = useState(initialDescription);

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
    };
    return updateInvestible(updateInfo)
      .then((data) => {
        investiblesDispatch(localUpdateInvestible({ ...fullInvestible, investible: data }));
        onSave();
      });
  }

  function handleSubmit() {
    let newStage;
    return handleSave().then(() => {
      const currentUser = getMyUserForMarket(marketsState, marketId);
      const stages = getStages(marketStagesState, marketId);
      const { market_admin: isAdmin } = getFlags(currentUser);
      if (isAdmin) {
        newStage = stages.find((stage) => stage.allows_investment);
      } else {
        // Submit to moderation
        newStage = stages.find((stage) => !stage.allows_investment);
      }
      const { market_infos: marketInfos } = fullInvestible;
      const marketInfo = marketInfos.find((info) => info.market_id === marketId);
      console.debug(`Submitting to stage ${newStage.name} with previous stage ${marketInfo.stage}`);
      const stageInfo = {
        current_stage_id: marketInfo.stage,
        stage_id: newStage.id,
      };
      const submitInfo = {
        marketId,
        investibleId: id,
        stageInfo,
      };
      return submitToModerator(submitInfo);
    }).then(() => investiblesDispatch(localUpdateInvestible({ ...fullInvestible, stage_name: newStage.name })));
    //TODO: what is the result of submitting to the moderator?
  }

  return (
    <Card>
      <CardContent>
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
        {!isAdmin && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
          >
            {intl.formatMessage({ id: 'investibleEditSubmitLabel' })}
          </Button>
        )}
      </CardActions>
    </Card>

  );
}

DecisionInvestibleEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  isAdmin: PropTypes.bool,
};

DecisionInvestibleEdit.defaultProps = {
  onSave: () => {},
  onCancel: () => {},
  isAdmin: false,
};
export default withStyles(styles)(injectIntl(DecisionInvestibleEdit));
