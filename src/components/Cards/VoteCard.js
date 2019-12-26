import React from "react";
import clsx from "clsx";
import { useIntl } from "react-intl";
import { Textfit } from "react-textfit";
import PropTypes from "prop-types";
import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import CustomChip from "../CustomChip";
import { MAX_FONTSIZE, MIN_FONTSIZE } from "../../constants/global";
import { getCertaintyChart } from "../../utils/userFunctions";

const useStyles = makeStyles(theme => ({
  container: {
    display: "grid",
    gridTemplateColumns: "calc(100% - 96px) 96px",
    width: "100%",
    height: "97px",
    padding: "10px 0",
    background: "white"
  },
  content: {
    display: "grid",
    gridTemplateRows: "max-content 1fr",
    borderRight: "1px solid #eaeaea",
    padding: "0 20px",
    maxHeight: "100%",
    minHeight: "100%",
    alignItems: "center",
    justifyItems: "start",
    overflow: "hidden"
  },
  title: {
    fontWeight: "bold",
    color: "#3e3e3e",
    margin: "3px",
    maxHeight: "50px",
    minHeight: "50px",
    justifySelf: "stretch",
    display: "flex",
    alignItems: "center"
  },
  largeTitle: {
    gridRowStart: "1",
    gridRowEnd: "3"
  },
  chartContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: '5px',
  },
  chartValue: {
    fontSize: 14,
    lineHeight: "16px",
    color: "#3e3e3e",
    marginTop: "17px"
  },
  iconGrid: {
    flexWrap: "nowrap",
    overflow: "hidden"
  }
}));

function VoteCard(props) {
  const { title, comments, votes } = props;
  const classes = useStyles();
  const intl = useIntl();

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <Grid className={classes.iconGrid} container spacing={1}>
          {comments.map((item, index) => (
            <Grid item key={index}>
              <CustomChip type={item.comment_type} content={item.body} />
            </Grid>
          ))}
        </Grid>
        <Textfit
          className={clsx(classes.title, {
            [classes.largeTitle]: comments.length === 0
          })}
          max={MAX_FONTSIZE}
          min={MIN_FONTSIZE}
        >
          {title}
        </Textfit>
      </div>
      <div className={classes.chartContent}>
        <div className={classes.chart}>{getCertaintyChart(votes)}</div>
        <span className={classes.chartValue}>
          {intl.formatMessage({ id: "numVoting" }, { x: votes.length })}
        </span>
      </div>
    </div>
  );
}

VoteCard.propTypes = {
  title: PropTypes.string,
  comments: PropTypes.arrayOf(PropTypes.object),
  votes: PropTypes.arrayOf(PropTypes.object)
};

VoteCard.defaultProps = {
  title: "",
  comments: [],
  votes: null
};

export default VoteCard;
