import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import CommentAdd from '../../components/Comments/CommentAdd';

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  addBox: {},
}));


function CommentAddBox(props) {
  const {
    marketId,
    investible,
    type,
    allowedTypes,
    onCancel,
    onSave,
    hidden,
  } = props;


  const classes = useStyles();

  function getAddRegions() {
    return allowedTypes.map((allowedType) => {
      const typeHidden = hidden || allowedType !== type;
      return (
        <CommentAdd
          key={allowedType}
          hidden={typeHidden}
          type={allowedType}
          investible={investible}
          marketId={marketId}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    });
  }


  return (
    <div
      className={classes.addBox}
    >
      {getAddRegions()}
    </div>
  );
}

CommentAddBox.propTypes = {
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.any,
  type: PropTypes.string.isRequired,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  hidden: PropTypes.bool,
};

CommentAddBox.defaultProps = {
  investible: undefined,
  onCancel: () => {},
  onSave: () => {},
  hidden: false,
};

export default CommentAddBox;
