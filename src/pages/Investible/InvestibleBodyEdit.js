import { makeStyles } from '@material-ui/core/styles';

export const useInvestibleEditStyles = makeStyles(
  theme => ({
    actions: {
      marginTop: '1rem'
    },
    containerEditable: {
      cursor: 'url(\'/images/edit_cursor.svg\') 0 24, pointer',
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
      lineHeight: '42px',
      paddingBottom: '9px',
      [theme.breakpoints.down('sm')]: {
        fontSize: 25
      }
    }
  }),
  { name: "PlanningEdit" }
);
