/**
 * Single-select "pill" choice control — a modern replacement for a RadioGroup
 * (T-all-2167). Each option is a pill matching the app's buttons; the selected
 * one is filled brand-blue. Keeps single-select semantics and is keyboard
 * operable (Tab to a pill, Enter/Space to choose).
 *
 * Two layouts:
 *  - default (horizontal): pills wrap in a row. A long name can pass a short
 *    `label` plus a `tooltip` holding the explanatory part (S-1).
 *  - vertical: one option per row, the short name in the pill and an inline
 *    `description` shown after it (C-all-977) — used where there is room for
 *    the explanation, like the Compose "what to create" step.
 *
 * options: [{ value, label: node, description?: node, tooltip?: string, id? }]
 * value: currently selected value
 * onChange: (value) => void
 * vertical: lay options out one per row with inline descriptions
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(
  (theme) => {
    const dark = theme.palette.type === 'dark';
    return {
      group: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        // Breathing room around the group, restoring the vertical spacing the
        // old radios got from their per-item margins (C-all-978).
        margin: '1rem 0 0.5rem',
      },
      groupVertical: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '10px',
        margin: '1rem 0 0.5rem',
      },
      row: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '100%',
      },
      description: {
        color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        fontSize: '0.9rem',
      },
      // Larger, readable hover text (the default MUI tooltip font is tiny).
      tooltipText: {
        fontSize: '0.95rem',
        lineHeight: 1.4,
      },
      pill: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 16px',
        borderRadius: '999px',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.23)'}`,
        backgroundColor: 'transparent',
        color: dark ? '#fff' : '#1c2b2e',
        fontSize: '0.9rem',
        fontWeight: 500,
        lineHeight: 1.4,
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        flex: 'none',
        transition: 'background-color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .06s ease',
        '&:hover': {
          backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        },
        '&:active': {
          transform: 'translateY(1px) scale(0.985)',
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
        },
      },
      pillSelected: {
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
        color: '#fff',
        boxShadow: '0 2px 6px rgba(47, 128, 237, 0.35)',
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
          borderColor: theme.palette.primary.dark,
        },
      },
    };
  },
  { name: 'ChoicePills' }
);

function ChoicePills(props) {
  const { options, value, onChange, ariaLabel, vertical = false } = props;
  const classes = useStyles();

  function handleKeyDown(event, optionValue) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange(optionValue);
    }
  }

  return (
    <div className={vertical ? classes.groupVertical : classes.group} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = value === option.value;
        const pill = (
          <span
            id={option.id}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            className={selected ? `${classes.pill} ${classes.pillSelected}` : classes.pill}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, option.value)}
            onMouseDown={(event) => event.preventDefault()}
          >
            {option.label}
          </span>
        );
        const control = option.tooltip ? (
          <Tooltip title={<span className={classes.tooltipText}>{option.tooltip}</span>} placement="top">
            {pill}
          </Tooltip>
        ) : pill;
        if (option.description) {
          return (
            <div key={option.value} className={classes.row}>
              {control}
              <span className={classes.description}>{option.description}</span>
            </div>
          );
        }
        return <React.Fragment key={option.value}>{control}</React.Fragment>;
      })}
    </div>
  );
}

ChoicePills.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.node.isRequired,
      description: PropTypes.node,
      tooltip: PropTypes.string,
      id: PropTypes.string,
    })
  ).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
  vertical: PropTypes.bool,
};

export default ChoicePills;
