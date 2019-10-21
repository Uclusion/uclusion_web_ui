import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, TextField, withStyles } from '@material-ui/core';
import { updateMarket } from '../../api/markets';
import { injectIntl } from 'react-intl';

import { filterUploadsUsedInText } from '../TextEditors/fileUploadFilters';
import QuillEditor from '../TextEditors/QuillEditor';
import { AsyncMarketsContext } from '../../contexts/AsyncMarketContext';

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
    onSave,
    market,
    classes,
    intl,
  } = props;
  const { id } = market;
  const { updateMarketLocally } = useContext(AsyncMarketsContext);
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
    const filteredUploads = filterUploadsUsedInText(uploadedFiles, description);
    console.debug(filteredUploads);
    return updateMarket(id, name, description, filteredUploads)
      .then(() => updateMarketLocally(market))
      .then(() => onSave());
  }


  function onEditorChange(content) {
    const description = content;
    setMutableMarket({ ...market, description });
  }

  function onS3Upload(metadatas) {
    console.debug('Firing S3 upload');
    const newUploadedFiles = [...uploadedFiles, ...metadatas];
    setUploadedFiles(newUploadedFiles);
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
        <QuillEditor onChange={onEditorChange}
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
  market: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  editToggle: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default withStyles(styles)(injectIntl(MarketEdit));
