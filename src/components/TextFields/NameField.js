import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { FormControl, InputAdornment, OutlinedInput } from '@material-ui/core'
import { useIntl } from 'react-intl';
import { nameFromDescription } from '../../utils/stringFunctions'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../localStorageUtils'
import { scrollToElement } from '../../contexts/ScrollContext'
import { getQuillStoredState } from '../TextEditors/Utilities/CoreUtils'
import InputLabel from '@material-ui/core/InputLabel'

export function getNameStoredState(id) {
  return getUclusionLocalStorageItem(`name-editor-${id}`);
}

export function clearNameStoredState(id) {
  setUclusionLocalStorageItem(`name-editor-${id}`, null);
}

function NameField(props) {
  const {
    editorName, label, placeHolder, id, useCreateDefault, scrollId
  } = props;
  const intl = useIntl();
  const defaultValue = getNameStoredState(id);
  const [charactersLeft, setCharactersLeft] = useState(80 - (defaultValue || '').length);

  function storeState(state) {
    setUclusionLocalStorageItem(`name-editor-${id}`, state);
  }

  function createDefaultName() {
    if (useCreateDefault && !defaultValue) {
      const element = document.getElementById(scrollId || id)
      if (element) {
        element.focus({preventScroll: false});
        // Crazy hack to make the cursor show up - would be nice to have a better way
        setTimeout(() => {
          element.value = ' ';
          element.click();
        }, 40);
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
  }

  function handleChange(event) {
    const { value } = event.target;
    storeState(value);
    setCharactersLeft(80 - (value || '').length);
  }

  return (
    <FormControl variant="outlined" style={{marginBottom: '10px', width: '100%'}}>
      <InputLabel htmlFor='display-name'>{intl.formatMessage({ id: label })}</InputLabel>
      <OutlinedInput
        id={id}
        onFocus={createDefaultName}
        autoFocus={useCreateDefault}
        defaultValue={getNameStoredState(id)}
        onChange={handleChange}
        placeholder={intl.formatMessage({
          id: placeHolder
        })}
        label={intl.formatMessage({ id: label })}
        endAdornment={
          <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
            {charactersLeft}
          </InputAdornment>
        }
      />
    </FormControl>
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