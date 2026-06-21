import { makeStyles } from '@material-ui/core/styles';

export const useInvestibleEditStyles = makeStyles(
  theme => ({
    actions: {
      marginTop: '1rem'
    },
    containerEditable: {
      // T-all-2215: plain hand (pointer) on hover instead of the pencil cursor (jobs and options).
      cursor: 'pointer',
      [theme.breakpoints.down("sm")]: {
        paddingLeft: 'unset',
      }
    },
    container: {
      [theme.breakpoints.down("sm")]: {
        paddingLeft: 'unset',
      }
    },
    title: {
      fontSize: 28,
      color: 'black',
      lineHeight: '42px',
      paddingBottom: '9px',
      [theme.breakpoints.down('sm')]: {
        fontSize: 25
      }
    }
  }),
  { name: "PlanningEdit" }
);
