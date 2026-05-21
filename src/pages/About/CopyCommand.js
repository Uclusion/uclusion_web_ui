import { IconButton, Tooltip } from "@material-ui/core";
import { FileCopyOutlined } from "@material-ui/icons";
import { useState } from "react";
import PropTypes from 'prop-types';

function CopyCommand (props) {
    const { command } = props;
    const [copied, setCopied] = useState(false);
    return (
      <div
        style={{
          position: 'relative',
          backgroundColor: '#f6f8fa',
          border: '1px solid #e1e4e8',
          borderRadius: '6px',
          padding: '12px 44px 12px 16px',
        }}
      >
        <code
          style={{
            display: 'block',
            fontFamily: 'Menlo, Consolas, monospace',
            fontSize: '0.875rem',
            color: '#24292e',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            lineHeight: 1.5,
          }}
        >
          {command}
        </code>
        <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'} placement="top">
          <IconButton
            size="small"
            aria-label="copy command"
            style={{position: 'absolute', top: '6px', right: '6px'}}
            onClick={() => {
              navigator.clipboard.writeText(command);
              setCopied(true);
            }}
            onMouseLeave={() => setCopied(false)}
          >
            <FileCopyOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    );
  }
  
  CopyCommand.propTypes = {
    command: PropTypes.string.isRequired,
  };

  export default CopyCommand;