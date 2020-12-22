import React from 'react'
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash'
import { nameFromDescription } from '../../utils/stringFunctions'

function NameField(props) {
  const intl = useIntl();
  const {
    onEditorChange, onStorageChange, description, name, label, placeHolder, id, useCreateDefault
  } = props;
  const debouncedOnStoreChange = _.debounce((value) => {
    onStorageChange(value);
  }, 500);

  function createDefaultName() {
    if (description && !name) {
      const found = nameFromDescription(description);
      if (found) {
        onEditorChange(found);
      }
    }
  }

  function handleChange(event) {
    const { value } = event.target;
    onEditorChange(value);
    debouncedOnStoreChange(value);
  }

  return (
    <>
      {useCreateDefault && (
        <TextField
          onFocus={createDefaultName}
          fullWidth
          id={id}
          label={intl.formatMessage({ id: label })}
          onChange={handleChange}
          placeholder={intl.formatMessage({
            id: placeHolder
          })}
          value={name}
          variant="filled"
        />
      )}
      {!useCreateDefault && (
        <TextField
          fullWidth
          id={id}
          label={intl.formatMessage({ id: label })}
          onChange={handleChange}
          placeholder={intl.formatMessage({
            id: placeHolder
          })}
          defaultValue={name}
          variant="filled"
        />
      )}
    </>
  )
}

NameField.propTypes = {
  onEditorChange: PropTypes.func.isRequired,
  onStorageChange: PropTypes.func.isRequired,
  description: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  placeHolder: PropTypes.string,
  label: PropTypes.string,
  useCreateDefault: PropTypes.bool
}

NameField.defaultProps = {
  id: "plan-investible-name",
  placeHolder: "storyTitlePlaceholder",
  label: "agilePlanFormTitleLabel",
  useCreateDefault: false
}

export default NameField;