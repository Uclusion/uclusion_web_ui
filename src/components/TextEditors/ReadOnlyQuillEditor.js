import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Quill from "quill";
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";

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
        }
      },

      heading: {
        "& .ql-container.ql-snow": {
          fontSize: 20,
          fontWeight: "bold"
        }
      }
    };
  },
  { name: "ReadOnlyQuillEditor" }
);

function ReadOnlyQuillEditor(props) {
  const { className, heading, value } = props;
  const box = useRef(null);

  const classes = useStyles(props);

  const quillOptions = {
    modules: {
      toolbar: false
    },
    readOnly: true,
    theme: "snow"
  };

  useEffect(() => {
    if (box.current !== null) {
      box.current.innerHTML = value;
      new Quill(box.current, quillOptions);
    }
    return () => {};
  }, [box, value, quillOptions]);

  return (
    <div className={clsx(classes.root, heading && classes.heading, className)}>
      <div ref={box} />
    </div>
  );
}

ReadOnlyQuillEditor.propTypes = {
  editorClassName: PropTypes.string,
  value: PropTypes.string.isRequired,
  heading: PropTypes.bool
};

ReadOnlyQuillEditor.defaultProps = {
  heading: false
};

export default ReadOnlyQuillEditor;
