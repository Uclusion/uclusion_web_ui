/**
 Html RTF editor based on slate, that's we can ue wherever we need full text editing
 It accepts an onChange property, which will return the string HTML value of the current state of the editor,
 the initialText property which will be the text string renedered if no existing state is available,
 and an ObjectId which will be used to search for state that hasn't been flushed (eg. we reloaded) without saving
 It's onchange handler emulates the material ui input type onChange emission
 * */


import React from 'react';
import Html from 'slate-html-serializer';
import PropTypes from 'prop-types';
import { rules } from './SlateEditors/html_rules';
import RichTextEditor from './SlateEditors/RichTextEditor';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import withAppConfigs from '../../utils/withAppConfigs';

class HtmlRichTextEditor extends React.Component {
  constructor(props) {
    super(props);

    this.html = new Html({ rules });

    const { value } = props;
    this.state = {
      value: this.html.deserialize(value),
    };
  }

  /** This is a dirty hack to hook into the update cycle in case the upstream value props changes
   * This code should really look into switching to hooks
   */
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.value !== this.props.value) {
      this.setState({ value: this.html.deserialize(nextProps.value) });
    }
    return true;
  }

  onChange = ({ value }) => {
    const { readOnly, onChange, appConfig } = this.props;
    if (!readOnly) {
      // When the document changes, save the serialized HTML to Local Storage.
      if (value.document !== this.state.value.document) {
        const string = this.html.serialize(value);
        // check if we're outside of our 350K limit. If so, throw an error to the ui
        // and ignore the update
        if (string.length > appConfig.maxRichTextEditorSize) {
          sendIntlMessage(ERROR, { id: 'editBoxTooManyBytes' });
        }
        // call the parent onChange with the string html value
        // in order emulate material ui field's onchange symantics
        if (onChange) {
          const changeUpdate = { target: { value: string } };
          onChange(changeUpdate);
        }
      }

      this.setState({ value });
    }
  };

  // Render the editor.
  render() {
    const { readOnly, placeHolder } = this.props;
    const { value } = this.state;
    return (
      <RichTextEditor
        value={value}
        placeHolder={placeHolder}
        onChange={this.onChange}
        readOnly={readOnly}
      />
    );
  }
}


HtmlRichTextEditor.propTypes = {
  value: PropTypes.string,
  placeHolder: PropTypes.string.isRequired,
  onChange: PropTypes.func,
};

export default withAppConfigs(HtmlRichTextEditor);
