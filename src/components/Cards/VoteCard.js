import React from "react";
import clsx from "clsx";
import { useIntl } from "react-intl";
import { Textfit } from "react-textfit";
import PropTypes from "prop-types";
import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import CustomChip from "../CustomChip";
import { MAX_FONTSIZE, MIN_FONTSIZE } from "../../constants/global";
import Chart from "./Chart";

const useStyles = makeStyles(theme => ({
  container: {
    display: "grid",
    gridTemplateColumns: "calc(100% - 96px) 96px",
    width: "100%",
    height: "97px",
    padding: "10px 0",
    background: "white"
  },
  title: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "77px",
    margin: "3px",
    padding: "0 20px",
    fontWeight: "bold",
    color: "#3e3e3e",
		borderRight: "1px solid #eaeaea",
		overflow: 'hidden',
  },
  chartContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  chartValue: {
    fontSize: 14,
    lineHeight: "16px",
    color: "#3e3e3e",
    marginTop: "17px"
  },
  iconGrid: {
    flexWrap: "nowrap",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
}));

function VoteCard(props) {
  const { title, comments, votes } = props;
  const classes = useStyles();
  const intl = useIntl();
  const issuesExist = comments.length > 0;

  return (
    <div className={classes.container}>
      <Textfit className={classes.title} max={MAX_FONTSIZE} min={MIN_FONTSIZE}>
        {title}
      </Textfit>
      {issuesExist && (
        <Grid className={classes.iconGrid} container spacing={1}>
          {comments.map((item, index) => (
            <Grid item key={index}>
              <CustomChip type={item.comment_type} content={item.body} />
            </Grid>
          ))}
        </Grid>
      )}
      {!issuesExist && (
        <div className={classes.chartContent}>
          <Chart data={votes} />
          <span className={classes.chartValue}>
            {intl.formatMessage({ id: "numVoting" }, { x: votes.length })}
          </span>
        </div>
      )}
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
