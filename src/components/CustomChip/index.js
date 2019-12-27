import React from "react";
import PropTypes from "prop-types";
import { Chip } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { getCommentTypeIcon } from "../../components/Comments/commentFunctions";
import { createTitle } from '../../utils/marketIdPathFunctions';

const useStyles = makeStyles({
  chipItem: {
    color: "#fff",
    height: "22px",
    "& .MuiChip-label": {
      fontSize: 12
    }
  },
  chipItemDisable: {
    background: "#dfdfdf"
  },
  chipItemActive: {
    background: "#ca2828"
  },
  avatar: {
    width: "16px",
    height: "14px",
    color: "#fff"
  }
});

function CustomChip(props) {
  const { active, type, content } = props;
  const classes = useStyles();
  const label = isHTML(content)
    ? content.slice(content.indexOf(">") + 1, content.lastIndexOf("<"))
    : content;

  function isHTML(str) {
    return /<\/?[a-z][\s\S]*>/i.test(str);
  }

  return (
    <React.Fragment>
      {content && (
        <Chip
          className={
            active
              ? `${classes.chipItem} ${classes.chipItemActive}`
              : `${classes.chipItem} ${classes.chipItemDisable}`
          }
          classes={{
            avatar: active
              ? `${classes.chipItemActive} ${classes.avatar}`
              : `${classes.chipItemDisable} ${classes.avatar}`
          }}
          avatar={getCommentTypeIcon(type)}
          label={createTitle(label, 8)}
        />
      )}
    </React.Fragment>
  );
}

CustomChip.propTypes = {
  active: PropTypes.bool,
  type: PropTypes.string,
  content: PropTypes.string
};

CustomChip.defaultProps = {
  active: true,
  type: "",
  content: ""
};

export default CustomChip;
