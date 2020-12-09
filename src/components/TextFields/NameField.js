import React from 'react'
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash'

function NameField(props) {
  const intl = useIntl();
  const {
    onEditorChange, onStorageChange, description, name, label, placeHolder, id
  } = props;
  const debouncedOnStoreChange = _.debounce((value) => {
    onStorageChange(value);
  }, 500);

  function findFirst(list) {
    let found = -1;
    for (let i = 0, len = list.length; i < len; i++) {
      let index = description.indexOf(list[i]);
      if (index >= 0) {
        if (found < 0 || index < found) found = index;
      }
    }
    if (found >= 0) {
      return description.substring(0, found);
    }
    return undefined;
  }

  function createDefaultName() {
    if (description && !name) {
      const found = findFirst(["</p", "</li", "</td"]);
      if (found) {
        onEditorChange(found.replace(/(<([^>]+)>)/ig,''));
      }
    }
  }

  function handleChange(event) {
    const { value } = event.target;
    onEditorChange(value);
    debouncedOnStoreChange(value);
  }

  return (
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
  )
}

NameField.propTypes = {
  onEditorChange: PropTypes.func.isRequired,
  onStorageChange: PropTypes.func.isRequired,
  description: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  placeHolder: PropTypes.string,
  label: PropTypes.string
}

NameField.defaultProps = {
  id: "plan-investible-name",
  placeHolder: "storyTitlePlaceholder",
  label: "agilePlanFormTitleLabel"
}

export default NameField;