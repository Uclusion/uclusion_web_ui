import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import CommentAdd from '../../components/Comments/CommentAdd';
import { CommentAddContext } from '../../contexts/CommentAddContext';

const useStyles = makeStyles(() => {
  return {
    hidden: {
      dispatch: 'none',
    },
    addBox: {},
  };
});


function CommentAddBox(props) {
  const {
    marketId,
    investible,
  } = props;

  const [addState, setAddState] = useContext(CommentAddContext);
  const { hidden, type, allowedTypes } = addState;


  function closeBox() {
    setAddState({
      ...addState,
      hidden: true,
    });
  }


  const classes = useStyles();

  function getAddRegions(){
    return allowedTypes.map((allowedType) => {
      const hidden = allowedType !== type;
      console.log(hidden);
      return (
        <CommentAdd
          key={allowedType}
          hidden={hidden}
          type={allowedType}
          investible={investible}
          marketId={marketId}
          onSave={closeBox}
          onCancel={closeBox} />
      );
    })
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
  investible: PropTypes.any,
};

CommentAddBox.defaultProps = {
  investible: undefined,
};

export default CommentAddBox;