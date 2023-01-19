import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";
import 'quill/dist/quill.snow.css';
import 'quill-table-ui/dist/index.css';
import './editorStyles.css';
import QuillEditor2 from './QuillEditor2'
import _ from 'lodash'

const useStyles = makeStyles(
  theme => {
    return {
      root: {
        "& .ql-container.ql-snow": {
          fontFamily: theme.typography.fontFamily,
          fontSize: 15,
          border: 0
        },
        "& .ql-editor": {
          paddingLeft: 0
        },
      },
      editable: {
        "& > *": {
          cursor: "url('/images/edit_cursor.svg') 0 24, pointer"
        }
      },
      notEditable: {},
    };
  },
  { name: "ReadOnlyQuillEditor" }
);

function ReadOnlyQuillEditor(props) {
  const { value, setBeingEdited, isEditable, id, noOverflow } = props;
  const classes = useStyles();

  if (!id) {
    return React.Fragment;
  }

  return (
    <div className={clsx(classes.root, isEditable ? classes.editable : classes.notEditable)}
         onClick={(event) => {
           if (isEditable) {
             setBeingEdited(true, event);
           }
         }}>
      {!_.isEmpty(value) && (
        <QuillEditor2
          id={`readOnly${id}`}
          value={value}
          noToolbar
          noOverflow={noOverflow}
        />
      )}
    </div>
  );
}

ReadOnlyQuillEditor.propTypes = {
  value: PropTypes.string,
  setBeingEdited: PropTypes.func,
  isEditable: PropTypes.bool,
};

ReadOnlyQuillEditor.defaultProps = {
  value: '',
  setBeingEdited: () => {},
  isEditable: false
};

export default ReadOnlyQuillEditor;
