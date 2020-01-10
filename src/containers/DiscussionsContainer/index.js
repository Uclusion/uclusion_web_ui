import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core";
import SubSection from "../../containers/SubSection/SubSection";
import { SECTION_TYPE_SECONDARY } from "../../constants/global";
import DiscussionCard from "../../components/Cards/DiscussionCard";

const useStyles = makeStyles(theme => ({
  cardGridLayout: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridGap: "6px",
    marginTop: "6px"
  }
}));

function DiscussionContainer(props) {
  const classes = useStyles();
  const { header, data } = props;
  console.log(data);
  return (
    <SubSection type={SECTION_TYPE_SECONDARY} title={header}>
      <div className={classes.cardGridLayout}>
        {data.map((item) => {
          return (
            <DiscussionCard
              key={item.id}
              status={item.status}
              warning={item.warning}
              content={item.body}
            />
          );
        })}
      </div>
    </SubSection>
  );
}

DiscussionContainer.propTypes = {
  header: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.object)
};

DiscussionContainer.defaultProps = {
  header: "",
  data: [],
};

export default DiscussionContainer;
