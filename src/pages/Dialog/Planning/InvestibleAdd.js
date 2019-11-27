import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  TextField,
  withStyles,
} from '@material-ui/core';
import { useHistory } from 'react-router';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import { addPlanningInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';

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

function InvestibleAdd(props) {
  const {
    marketId, intl, classes, onCancel, onSave, marketPresences,
  } = props;

  const history = useHistory();
  const emptyInvestible = { name: '', assignments: [] };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const { name } = currentValues;

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  const handleChangeMultiple = (event) => {
    const { options } = event.target;
    const values = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    setAssignments(values);
  };

  function onEditorChange(description) {
    setDescription(description);
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function zeroCurrentValues() {
    setCurrentValues(emptyInvestible);
    setDescription('');
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel();
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addInfo = {
      marketId,
      uploadedFiles: filteredUploads,
      description: tokensRemoved,
      name,
      assignments,
    };
    return addPlanningInvestible(addInfo).then((investibleId) => {
      onSave();
      const link = formInvestibleLink(marketId, investibleId);
      return navigate(history, link);
    });
  }

  return (
    <Card>
      <CardContent>
        <FormControl className={classes.row}>
          <InputLabel shrink htmlFor="select-multiple-native">
            Assignments
          </InputLabel>
          <Select
            multiple
            native
            value={assignments}
            onChange={handleChangeMultiple}
            inputProps={{
              id: 'select-multiple-assignment',
            }}
          >
            {marketPresences.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'investibleAddTitleLabel' })}
          placeholder={intl.formatMessage({ id: 'investibleAddTitleDefault' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
        <QuillEditor
          marketId={marketId}
          onChange={onEditorChange}
          placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
          onS3Upload={onS3Upload}
          defaultValue={description}
        />
      </CardContent>
      <CardActions>
        <Button onClick={handleCancel}>
          {intl.formatMessage({ id: 'investibleAddCancelLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'investibleAddSaveLabel' })}
        </Button>
      </CardActions>
    </Card>

  );
}

InvestibleAdd.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
};

InvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
};

export default withStyles(styles)(injectIntl(InvestibleAdd));
