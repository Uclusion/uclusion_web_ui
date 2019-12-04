import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, makeStyles, TextField } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { lockPlanningMarketForEdit, updateMarket } from '../../api/markets';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { updateMarket as localUpdateMarket } from '../../contexts/MarketsContext/marketsContextReducer';
import { processTextAndFilesForSave } from '../../api/files';
import { PLANNING_TYPE } from '../../constants/markets';

const useStyles = makeStyles((theme) => {
  return {
    root: {
      padding: theme.spacing(2),
    },
    row: {
      marginBottom: theme.spacing(2),
      '&:last-child': {
        marginBottom: 0,
      },
    },
  };
});

function DialogEdit(props) {

  const {
    editToggle,
    onCancel,
    market,
  } = props;
  const { id, market_type: marketType } = market;
  const intl = useIntl();
  const classes = useStyles();
  const [, marketsDispatch] = useContext(MarketsContext);
  const [mutableMarket, setMutableMarket] = useState(market);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name } = mutableMarket;
  const [description, setDescription] = useState(mutableMarket.description);

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
    chain = chain.then(() => updateMarket(id, name, tokensRemoved, filteredUploads))
      .then(() => marketsDispatch(localUpdateMarket(market)))
      .then(() => editToggle());
    return chain;
  }

  function onEditorChange(content) {
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
        <QuillEditor
          onChange={onEditorChange}
          defaultValue={description}
          readOnly={false}
          marketId={id}
          onS3Upload={onS3Upload}
        />
      </CardContent>
      <CardActions>
        <Button onClick={onCancel}>
          {intl.formatMessage({ id: 'marketEditCancelLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'marketEditSaveLabel' })}
        </Button>
      </CardActions>
    </Card>
  );
}

DialogEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  editToggle: PropTypes.func,
  onCancel: PropTypes.func,
};

DialogEdit.defaultProps = {
  onCancel: () => {},
  editToggle: () => {},
}

export default DialogEdit;
