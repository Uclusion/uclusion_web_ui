import React from 'react'
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { nameFromDescription } from '../../utils/stringFunctions'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../localStorageUtils'

export function getNameStoredState(id) {
  return getUclusionLocalStorageItem(`name-editor-${id}`);
}

export function clearNameStoredState(id) {
  setUclusionLocalStorageItem(`name-editor-${id}`, null);
}

function NameField(props) {
  const intl = useIntl();
  const {
    descriptionFunc, label, placeHolder, id, useCreateDefault
  } = props;

  function storeState(state) {
    setUclusionLocalStorageItem(`name-editor-${id}`, state);
  }

  function createDefaultName() {
    const description = descriptionFunc();
    if (description && !getNameStoredState(id)) {
      const found = nameFromDescription(description);
      if (found) {
        storeState(found);
        document.getElementById(id).value = found;
      }
    }
  }

  function handleChange(event) {
    const { value } = event.target;
    storeState(value);
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
          defaultValue={getNameStoredState(id)}
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
          defaultValue={getNameStoredState(id)}
          variant="filled"
        />
      )}
    </>
  )
}

NameField.propTypes = {
  descriptionFunc: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  placeHolder: PropTypes.string,
  label: PropTypes.string,
  useCreateDefault: PropTypes.bool
}

NameField.defaultProps = {
  placeHolder: "storyTitlePlaceholder",
  label: "agilePlanFormTitleLabel",
  useCreateDefault: false
}

export default NameField;