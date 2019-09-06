import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@material-ui/core';
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';


function Investible(props) {

  const { investible } = props;

  const { description } = investible;
  return (
    <Card>
      <CardContent>
        Test
        <HtmlRichTextEditor style={{ minHeight: 'auto' }} value={description} readOnly/>
      </CardContent>
    </Card>
  );
}

Investible.propTypes = {
  investible: PropTypes.object.isRequired,
};

export default Investible;
