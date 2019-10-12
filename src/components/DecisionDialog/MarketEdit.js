import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, TextField, withStyles } from '@material-ui/core';
import { updateMarket } from '../../api/markets';
import { injectIntl } from 'react-intl';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import useAsyncMarketsContext from '../../contexts/useAsyncMarketsContext';
import { filterUploadsUsedInText } from '../TextEditors/fileUploadFilters';

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

  const { editToggle, onSave, market, classes, intl } = props;
  const { id } = market;
  const { updateMarketLocally } = useAsyncMarketsContext();
  const [currentValues, setCurrentValues] = useState(market);
  const initialUploadedFiles = market.uploaded_files || [];
  const [ uploadedFiles, setUploadedFiles ] = useState(initialUploadedFiles);
  const { name, description } = currentValues;
  console.debug(description);

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      setCurrentValues({ ...currentValues, [name]: value });
    };
  }

  function handleFileUpload(metadata) {
    // console.log(metadata);
    const newUploadedFiles = [...uploadedFiles, metadata];
    setUploadedFiles(newUploadedFiles);
  }


  function handleSave() {
    const filteredUploads = filterUploadsUsedInText(uploadedFiles, description);
    return updateMarket(id, name, description, filteredUploads)
      .then(() => updateMarketLocally(currentValues))
      .then(() => onSave());
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
        <HtmlRichTextEditor handleFileUpload={handleFileUpload}
                            value={description}
                            onChange={handleChange('description')}
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
