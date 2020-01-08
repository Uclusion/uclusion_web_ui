import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card, CardActions, CardContent, makeStyles, TextField,
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import { lockPlanningMarketForEdit, updateMarket } from '../../../api/markets';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { PLANNING_TYPE } from '../../../constants/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  row: {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
}));

function PlanningDialogEdit(props) {
  const {
    editToggle,
    onCancel,
    market,
  } = props;
  const { id, market_type: marketType } = market;
  const intl = useIntl();
  const classes = useStyles();
  const [mutableMarket, setMutableMarket] = useState(market);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name, max_budget, investment_expiration } = mutableMarket;
  const [description, setDescription] = useState(mutableMarket.description);
  const [validForm, setValidForm] = useState(true);

  useEffect(() => {
    // Long form to prevent flicker
    if (name && parseInt(investment_expiration, 10) > 0 && parseInt(max_budget, 10) > 0
      && description && description.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, investment_expiration, max_budget, validForm]);

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      setMutableMarket({ ...market, [name]: value });
    };
  }

  function handleSave() {
    // the set of files for the market is all the old files, plus our new ones
    const oldMarketUploadedFiles = market.uploaded_files || [];
    const newUploadedFiles = [...uploadedFiles, ...oldMarketUploadedFiles];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    let chain = Promise.resolve(true);
    if (marketType === PLANNING_TYPE) {
      chain = chain.then(() => lockPlanningMarketForEdit(id, true));
    }
    chain = chain.then(() => updateMarket(id, name, tokensRemoved, filteredUploads,
      parseInt(max_budget, 10), parseInt(investment_expiration, 10)))
      .then(() => editToggle());
    return chain;
  }

  function onEditorChange(content) {
    // console.log(content);
    setDescription(content);
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  return (
    <Card>
      <CardContent>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'marketEditTitleLabel' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
        {marketType === PLANNING_TYPE && (
          <TextField
            id="maxBudget"
            label={intl.formatMessage({ id: 'maxMaxBudgetInputLabel' })}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            onChange={handleChange('max_budget')}
            value={max_budget}
          />
        )}
        {marketType === PLANNING_TYPE && (
          <TextField
            id="investmentExpiration"
            label={intl.formatMessage({ id: 'investmentExpirationInputLabel' })}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            onChange={handleChange('investment_expiration')}
            value={investment_expiration}
          />
        )}
        <QuillEditor
          onChange={onEditorChange}
          defaultValue={description}
          readOnly={false}
          marketId={id}
          onS3Upload={onS3Upload}
        />
      </CardContent>
      <CardActions>
        <SpinBlockingButtonGroup>
          <SpinBlockingButton
            marketId={id}
            onClick={onCancel}
          >
            {intl.formatMessage({ id: 'marketEditCancelLabel' })}
          </SpinBlockingButton>
          <SpinBlockingButton
            marketId={id}
            variant="contained"
            color="primary"
            disabled={!validForm}
            onClick={handleSave}
          >
            {intl.formatMessage({ id: 'marketEditSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>
  );
}

PlanningDialogEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  editToggle: PropTypes.func,
  onCancel: PropTypes.func,
};

PlanningDialogEdit.defaultProps = {
  onCancel: () => {
  },
  editToggle: () => {
  },
};

export default PlanningDialogEdit;
