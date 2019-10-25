import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, TextField, withStyles } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import { updateMarket } from '../../api/markets';
import QuillEditor from '../TextEditors/QuillEditor';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { updateMarket as localUpdateMarket } from '../../contexts/MarketsContext/marketsContextReducer';
import { processTextAndFilesForSave } from '../../api/files';

const styles = theme => ({
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

function MarketEdit(props) {

  const {
    editToggle,
    market,
    classes,
    intl,
  } = props;
  const { id } = market;

  const [, marketsDispatch] = useContext(MarketsContext);
  const [mutableMarket, setMutableMarket] = useState(market);
  const initialUploadedFiles = market.uploaded_files || [];
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const { name, description } = mutableMarket;

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      setMutableMarket({ ...market, [name]: value });
    };
  }

  function handleSave() {
    console.debug(uploadedFiles);
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    return updateMarket(id, name, tokensRemoved, filteredUploads)
      .then(() => marketsDispatch(localUpdateMarket(market)))
      .then(() => editToggle());
  }

  function onEditorChange(content) {
    const description = content;
    setMutableMarket({ ...market, description });
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
        <Button onClick={editToggle}>
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

MarketEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  editToggle: PropTypes.func.isRequired,
};

export default withStyles(styles)(injectIntl(MarketEdit));
