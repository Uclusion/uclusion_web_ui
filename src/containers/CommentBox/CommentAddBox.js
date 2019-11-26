import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import CommentAdd from '../../components/Comments/CommentAdd';

const useStyles = makeStyles(() => {
  return {
    hidden: {
      display: 'none',
    },
    addBox: {},
  };
});


function CommentAddBox(props) {
  const {
    marketId,
    investible,
    hidden,
    type,
    allowedTypes,
    onCancel,
    onSave,
  } = props;



  const classes = useStyles();

  function getAddRegions(){
    return allowedTypes.map((allowedType) => {
      const hidden = allowedType !== type;
      return (
        <CommentAdd
          key={allowedType}
          hidden={hidden}
          type={allowedType}
          investible={investible}
          marketId={marketId}
          onSave={onSave}
          onCancel={onCancel} />
      );
    });
  }


  return (
    <div
      className={(hidden) ? classes.hidden : classes.addBox}
    >
      {getAddRegions()}
    </div>
  );
}

CommentAddBox.propTypes = {
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.any,
  hidden: PropTypes.bool,
  type: PropTypes.string.isRequired,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

CommentAddBox.defaultProps = {
  investible: undefined,
  hidden: false,
  onCancel: () => {},
  onSave: () => {},
};

export default CommentAddBox;