import { darken, makeStyles } from '@material-ui/core/styles';

export const useLockedDialogStyles = makeStyles(
  (theme) => {
    return {
      root: {
        '& .MuiDialogTitle-root': {
          flex: '0 0 auto',
          margin: 0,
          padding: '16px 24px 0px 24px'
        },
      },
      title: {
        fontWeight: 'bold',
        textTransform: "capitalize",
        display: "flex",
        justifyContent: "center",
        "& h2": {
          display: "flex",
          alignItems: "center"
        }
      },
      titleIcon: {
        height: 16,
        width: 16,
        marginRight: 8,
      },
      titleDisplay: {
        fontSize: 32,
        lineHeight: "42px",
        paddingBottom: "9px",
        [theme.breakpoints.down("sm")]: {
          fontSize: 25
        }
      },
      titleEditable: {
        fontSize: 32,
        cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
        lineHeight: "42px",
        paddingBottom: "9px",
        [theme.breakpoints.down("sm")]: {
          fontSize: 25
        }
      },
      warningTitleIcon: {
        marginRight: 8,
        color: '#F2C94C',
      },
      content: {
        lineHeight: 1.75,
        textAlign: "center"
      },
      issueWarningContent: {
        lineHeight: 3,
        minWidth: '35rem',
        textAlign: "center"
      },
      actions: {
        flexBasis: "unset",
        justifyContent: "center"
      },
      action: {
        color: 'white',
        fontWeight: 'bold',
        paddingLeft: 24,
        paddingRight: 24,
        textTransform: "capitalize"
      },
      actionEdit: {
        backgroundColor: "#2D9CDB",
        "&:hover": {
          backgroundColor: darken("#2D9CDB", 0.08)
        },
        "&:focus": {
          backgroundColor: darken("#2D9CDB", 0.24)
        },
      },
      actionCancel: {
        backgroundColor: "#8C8C8C",
        "&:hover": {
          backgroundColor: darken("#8C8C8C", 0.04)
        },
        "&:focus": {
          backgroundColor: darken("#8C8C8C", 0.12)
        },
      }
    };
  },
  { name: "LockedDialog" }
);
