import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Quill from 'quill';
import { useTheme } from '@material-ui/core';

function ReadOnlyQuillEditor(props) {
  const { value } = props;
  const box = useRef(null);
  const theme = useTheme();

  const style = {
    fontFamily: theme.typography.fontFamily,
    fontSize: props.heading ? 20 : 15,
    fontWeight: props.heading ? 'bold' : '',
    border: 0,
    marginLeft: -15,
  };
  const quillOptions = {
    modules: {
      toolbar: false,
    },
    readOnly: true,
    theme: 'snow',
  };

  useEffect(() => {
    if (box.current !== null) {
      box.current.innerHTML = value;
      new Quill(box.current, quillOptions);
    }
    return () => {
    };
  }, [box, value, quillOptions]);

  return (
    <div>
      <div ref={box} style={style}/>
    </div>
  );
}

ReadOnlyQuillEditor.propTypes = {
  value: PropTypes.string.isRequired,
  heading: PropTypes.bool.isRequired,
};

export default ReadOnlyQuillEditor;