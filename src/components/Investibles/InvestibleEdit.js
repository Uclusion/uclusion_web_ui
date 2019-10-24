import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button, Card, CardActions, CardContent, TextField, withStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { updateInvestible } from '../../api/investibles';
import QuillEditor from '../TextEditors/QuillEditor';
import { updateInvestibleStage } from '../../api/marketInvestibles';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getFlags } from '../../utils/userFunctions';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { updateInvestible as localUpdateInvestible } from '../../contexts/InvestibesContext/investiblesContextReducer';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { processTextAndFilesForSave } from '../../api/files';


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

function InvestibleEdit(props) {
  const {
    investible, intl, classes, editToggle, onSave, marketId,
  } = props;

  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const myInvestible = investible.investible;
  const { id, description: initialDescription } = myInvestible;
  const [currentValues, setCurrentValues] = useState(myInvestible);
  const { name } = currentValues;
  const initialUploadedFiles = investible.uploaded_files || [];
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

  function handleFileUpload(metadata) {
    const newUploadedFiles = [...uploadedFiles, metadata];
    setUploadedFiles(newUploadedFiles);
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    return updateInvestible(marketId, id, name, tokensRemoved, filteredUploads)
      .then((data) => {
        investiblesDispatch(localUpdateInvestible({ ...investible, investible: data }));
        onSave();
      });
  }

  function handleSubmit() {
    let newStage;
    return handleSave().then(() =>  {
      const currentUser = getMyUserForMarket(marketsState, marketId);
      const stages = getStages(marketStagesState, marketId);
      const { market_admin: isAdmin } = getFlags(currentUser);
      if (isAdmin) {
        newStage = stages.find((stage) => stage.appears_in_market_summary);
      } else {
        // Submit to moderation
        newStage = stages.find((stage) => !stage.appears_in_market_summary
          && stage.visible_to_roles.length === 2);
      }
      const { market_infos: marketInfos } = investible;
      const marketInfo = marketInfos.find((info) => info.market_id === marketId);
      console.debug(`Submitting to stage ${newStage.name} with previous stage ${marketInfo.stage}`);
      return updateInvestibleStage(marketId, id, newStage.id, marketInfo.stage);
    })
      .then(() => investiblesDispatch(localUpdateInvestible({ ...investible, stage_name: newStage.name })));
  }

  console.debug('Investible edit being rerendered');

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
        <Button onClick={editToggle}>
          {intl.formatMessage({ id: 'investibleEditCancelLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'investibleEditSaveLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
        >
          {intl.formatMessage({ id: 'investibleEditSubmitLabel' })}
        </Button>
      </CardActions>
    </Card>

  );
}

InvestibleEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onSave: PropTypes.func,
  editToggle: PropTypes.func,
};

InvestibleEdit.defaultProps = {
  onSave: () => {},
  editToggle: () => {},
};
export default withStyles(styles)(injectIntl(InvestibleEdit));
