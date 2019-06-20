import React from 'react';
import Paper from '@material-ui/core/es/Paper/Paper';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Button from '@material-ui/core/es/Button/Button';
import { ERROR, sendIntlMessage } from '../../../utils/userMessage';
import HtmlRichTextEditor from '../../TextEditors/HtmlRichTextEditor';
import { createComment } from '../../../api/comments';
import withAppConfigs from '../../../utils/withAppConfigs';

class CommentsAdd extends React.Component {

  constructor(props) {
    super(props);
    this.state = { body: '' };
    this.handleChange = this.handleChange.bind(this);
    this.addOnClick = this.addOnClick.bind(this);
    this.validateAddState = this.validateAddState.bind(this);
  }

  addOnClick() {
    const {
      dispatch, marketId,  investibleId, appConfig,
    } = this.props;
    const { body } = this.state;
    if (body.length === 0) {
      sendIntlMessage(ERROR, { id: 'commentRequired' });
      return;
    }
    if (body.length > appConfig.maxRichTextEditorSize) {
      sendIntlMessage(ERROR, { id: 'commentTooManyBytes' });
      return;
    }
    createComment(investibleId, body, marketId, dispatch)
      .then(() => {
        this.setState({ body: '' });
      });
  }

  handleChange(name) {
    return (event) => {
      const value = event.target.value;
      this.setState({
        [name]: value,
      });
    };
  }


  validateAddState = () => {
    const { body } = this.state;
    const bodyValid = body && (body !== '<p></p>');
    // console.log(description);
    return bodyValid;
  };

  render() {
    const { intl } = this.props;
    const { body } = this.state;
    return (
      <Paper>
        <HtmlRichTextEditor value={body} placeHolder={intl.formatMessage({ id: 'commentBody' })} onChange={this.handleChange('body')} />
        <Button
          variant="contained"
          fullWidth
          color="primary"
          onClick={this.addOnClick}
          disabled={!this.validateAddState()}
        >
          {intl.formatMessage({ id: 'saveCommentButton' })}
        </Button>
      </Paper>
    );
  }
}

function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withAppConfigs(CommentsAdd)));
