import React from 'react';
import PropTypes from 'prop-types';
import ReadOnlyQuillEditor from '../../components/TextEditors/ReadOnlyQuillEditor';

function Summary(props) {
  const { market } = props;
  const { id, description } = market;

  return (
    <ReadOnlyQuillEditor marketId={id} value={description}/>
  );
}

Summary.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
};

export default Summary;
