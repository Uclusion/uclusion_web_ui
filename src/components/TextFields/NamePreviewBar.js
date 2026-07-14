import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { OutlinedInput } from '@material-ui/core';
import _ from 'lodash';
import { nameFromDescription } from '../../utils/stringFunctions';
import { getQuillStoredState } from '../TextEditors/Utilities/CoreUtils';

function computeName(editorName) {
  const description = getQuillStoredState(editorName);
  return (description ? nameFromDescription(description) : undefined) || '';
}

// J-all-347: preview of the name that will be auto-created from the description, heavily
// buffered - it recomputes two seconds after typing pauses (Q-all-222 O-1). refreshName is
// for after resetEditor, which does not fire the editor's onChange.
export function useNamePreview(editorName) {
  const [name, setName] = useState(() => computeName(editorName));
  const updateName = useMemo(() => _.debounce(() => setName(computeName(editorName)), 2000),
    [editorName]);
  useEffect(() => () => updateName.cancel(), [updateName]);

  function refreshName() {
    updateName.cancel();
    setName(computeName(editorName));
  }

  return { name, updateName, refreshName };
}

// J-all-347: read only and always visible with no placeholder (Q-all-223 O-3) - the step's
// instructions explain that the name comes from the description.
function NamePreviewBar(props) {
  const { name } = props;
  return (
    <OutlinedInput
      id='namePreviewBar'
      value={name}
      readOnly
      inputProps={{ tabIndex: -1 }}
      style={{ marginBottom: '10px', width: '100%', maxWidth: '43rem' }}
    />
  );
}

NamePreviewBar.propTypes = {
  name: PropTypes.string.isRequired
};

export default NamePreviewBar;
