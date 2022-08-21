import React from 'react'
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { nameFromDescription } from '../../utils/stringFunctions'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../localStorageUtils'
import { scrollToElement } from '../../contexts/ScrollContext'
import { getQuillStoredState } from '../TextEditors/Utilities/CoreUtils'

export function getNameStoredState(id) {
  return getUclusionLocalStorageItem(`name-editor-${id}`);
}

export function clearNameStoredState(id) {
  setUclusionLocalStorageItem(`name-editor-${id}`, null);
}

function NameField(props) {
  const intl = useIntl();
  const {
    editorName, label, placeHolder, id, useCreateDefault, scrollId
  } = props;

  function storeState(state) {
    setUclusionLocalStorageItem(`name-editor-${id}`, state);
  }

  function createDefaultName() {
    if (!getNameStoredState(id)) {
      const element = document.getElementById(scrollId || id)
      scrollToElement(element)
      const description = getQuillStoredState(editorName)
      if (description) {
        const found = nameFromDescription(description)
        if (found) {
          storeState(found)
          element.value = found
        }
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
          autoFocus
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
  editorName: PropTypes.string,
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

export default React.memo(NameField)