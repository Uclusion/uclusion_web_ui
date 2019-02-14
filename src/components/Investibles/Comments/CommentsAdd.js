import React from 'react';
import HtmlRichTextEditor from '../../TextEditors/HtmlRichTextEditor';
import { createComment } from "../../../store/Comments/actions";
import Paper from "@material-ui/core/es/Paper/Paper";
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Button from "@material-ui/core/es/Button/Button";

class CommentsAdd extends React.Component {

  constructor(props) {
    super(props);
    const { intl } = props;
    this.state = { body: intl.formatMessage({ id: 'commentBody' }) };
    this.handleChange = this.handleChange.bind(this);
    this.addOnClick = this.addOnClick.bind(this);
  }

  addOnClick() {
    const { dispatch, investibleId, intl } = this.props;
    const { body } = this.state;
    dispatch(createComment({ investibleId, body }));
    this.setState({ body: intl.formatMessage({ id: 'commentBody' }) });
  }

  handleChange(name) {
    return (event) => {
      const value = event.target.value;
      this.setState({
        [name]: value,
      });
    };
  }

  render() {
    const { intl } = this.props;
    return (
      <Paper>
        <HtmlRichTextEditor value={this.state.body} onChange={this.handleChange('body')} />
        <Button
          variant="contained"
          fullWidth
          color="primary"
          onClick={this.addOnClick}
        >
          {intl.formatMessage({id: 'saveCommentButton'})}
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

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(CommentsAdd));
