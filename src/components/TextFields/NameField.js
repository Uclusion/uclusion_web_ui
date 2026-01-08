import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types';
import { FormControl, InputAdornment, OutlinedInput } from '@material-ui/core'
import { useIntl } from 'react-intl';
import { nameFromDescription } from '../../utils/stringFunctions'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../localStorageUtils'
import { getQuillStoredState } from '../TextEditors/Utilities/CoreUtils'
import InputLabel from '@material-ui/core/InputLabel'
import _ from 'lodash';

export function getNameStoredState(id) {
  return getUclusionLocalStorageItem(`name-editor-${id}`);
}

export function clearNameStoredState(id) {
  setUclusionLocalStorageItem(`name-editor-${id}`, null);
}

export const NAME_MAX_LENGTH = 80;

function NameField(props) {
  const {
    editorName, label = "agilePlanFormTitleLabel", placeHolder = "storyTitlePlaceholder", id, useCreateDefault = false, scrollId, initialValue, setHasValue = () => {}, maxWidth = '43rem', autoFocus=true,
  } = props;
  const intl = useIntl();
  const defaultValue = getNameStoredState(id) || initialValue;
  const [charactersLeft, setCharactersLeft] = useState(NAME_MAX_LENGTH - (defaultValue || '').length);

  const focusWorkAround = useCallback((element) => {
    if (element) {
      // See https://blog.logrocket.com/how-to-autofocus-using-react-hooks/
      element.focus({preventScroll: false});
      setTimeout(() => {
        element.click();
      }, 40);
    }
  }, []);

  function storeState(state) {
    setUclusionLocalStorageItem(`name-editor-${id}`, state);
  }

  function createDefaultName() {
    if (useCreateDefault && !defaultValue) {
      const element = document.getElementById(scrollId || id)
      if (element) {
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
    setHasValue(!_.isEmpty(value));
  }

  return (
    <FormControl variant="outlined" style={{marginBottom: '10px', width: '100%', maxWidth: maxWidth, backgroundColor: 'white'}}>
      <InputLabel htmlFor='display-name'>{intl.formatMessage({ id: label })}</InputLabel>
      <OutlinedInput
        id={id}
        onFocus={createDefaultName}
        ref={focusWorkAround}
        defaultValue={defaultValue}
        onChange={handleChange}
        autoFocus={autoFocus}
        inputProps={{ maxLength : NAME_MAX_LENGTH }}
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
  useCreateDefault: PropTypes.bool,
  setHasValue: PropTypes.func,
  maxWidth: PropTypes.string
}

export default React.memo(NameField)