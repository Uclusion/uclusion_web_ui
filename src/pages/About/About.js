import React, { Component } from 'react';
import IconButton from '@material-ui/core/IconButton';
import { injectIntl, intlShape } from 'react-intl';
import ReactMarkdown from 'react-markdown';
import GitHubIcon from '../../components/Icons/GitHubIcon';
import Activity from '../../containers/Activity';
import Scrollbar from '../../components/Scrollbar/Scrollbar';
import README from './README.md';

require('github-markdown-css');

class About extends Component {
  // Sorry for using setState here but I have to remove 'marked' from the dependencies
  // because of a vulnerability issue
  constructor(props) {
    super(props);
    this.state = {
      text: '',
    };
  }

  componentWillMount() {
    fetch(README)
      .then(response => response.text())
      .then((text) => {
        this.setState({ text });
      });
  }

  render() {
    const { intl } = this.props;

    return (
      <Activity
        appBarContent={(
          <IconButton

            href="https://github.com/TarikHuber/react-most-wanted"
            target="_blank"
            rel="noopener"
          >
            <GitHubIcon />
          </IconButton>
)}
        title={intl.formatMessage({ id: 'about' })}
      >

        <Scrollbar>
          <div style={{ backgroundColor: 'white', padding: 12 }}>
            <ReactMarkdown
              className="markdown-body"
              source={this.state.text}
            />
          </div>
        </Scrollbar>

      </Activity>
    );
  }
}

About.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(About);
