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
    descriptionFunc, name, label, placeHolder, id, useCreateDefault, onEmptyNotEmptyChange
  } = props;

  function storeState(state) {
    setUclusionLocalStorageItem(`name-editor-${id}`, state);
  }

  function createDefaultName() {
    const description = descriptionFunc();
    if (description && !getNameStoredState(id)) {
      const found = nameFromDescription(description);
      if (found) {
        onEmptyNotEmptyChange();
        storeState(found);
        document.getElementById(id).value = found;
      }
    }
  }

  function handleChange(event) {
    const { value } = event.target;
    if (!value) {
      onEmptyNotEmptyChange(true);
    } else {
      const valueBefore = getNameStoredState(id);
      if (!valueBefore) {
        onEmptyNotEmptyChange(false);
      }
    }
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
          defaultValue={getNameStoredState(id) || name}
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
          defaultValue={getNameStoredState(id) || name}
          variant="filled"
        />
      )}
    </>
  )
}

NameField.propTypes = {
  descriptionFunc: PropTypes.func.isRequired,
  name: PropTypes.string,
  id: PropTypes.string.isRequired,
  placeHolder: PropTypes.string,
  label: PropTypes.string,
  useCreateDefault: PropTypes.bool,
  onEmptyNotEmptyChange: PropTypes.func
}

NameField.defaultProps = {
  placeHolder: "storyTitlePlaceholder",
  label: "agilePlanFormTitleLabel",
  useCreateDefault: false,
  onEmptyNotEmptyChange: () => {}
}

export default NameField;