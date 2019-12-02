import React from 'react';
import PropTypes from 'prop-types';
import QuillEditor from '../../components/TextEditors/QuillEditor';

function Summary(props) {
  const { market } = props;
  const { id, description } = market;

  return (
    <QuillEditor marketId={id} defaultValue={description} readOnly />
  );
}

Summary.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
};

export default Summary;
