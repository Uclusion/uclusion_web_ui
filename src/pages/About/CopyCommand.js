import { IconButton, Tooltip, useTheme } from "@material-ui/core";
import { FileCopyOutlined } from "@material-ui/icons";
import { useState } from "react";
import PropTypes from 'prop-types';

function CopyCommand (props) {
    const { command } = props;
    const [copied, setCopied] = useState(false);
    const theme = useTheme();
    // GitHub-style code block; dark variant keeps it readable on the dark card (T-all-2258).
    const isDark = theme.palette.type === 'dark';
    return (
      <div
        style={{
          position: 'relative',
          backgroundColor: isDark ? '#2d333b' : '#f6f8fa',
          border: `1px solid ${isDark ? '#444c56' : '#e1e4e8'}`,
          borderRadius: '6px',
          padding: '12px 44px 12px 16px',
        }}
      >
        <code
          style={{
            display: 'block',
            fontFamily: 'Menlo, Consolas, monospace',
            fontSize: '0.875rem',
            color: isDark ? '#adbac7' : '#24292e',
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
