import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  CHART_WIDTH,
  CHART_HEIGHT,
  CHART_BAR_COLOR_TOP,
  CHART_BAR_COLOR_BOTTOM
} from "../../constants/global";
import { getInvestmentBins } from "../../utils/userFunctions";

function Chart(props) {
  const [canvas, setCanvas] = useState(null);
  const { data } = props;

  function drawBar(props) {
    const { ctx, x, y, width, height, index } = props;
    const radius = 3;
    const color = Math.floor(
      ((CHART_BAR_COLOR_TOP - CHART_BAR_COLOR_BOTTOM) / 4) * index +
        CHART_BAR_COLOR_BOTTOM
    );
    var r = x + width;
    var b = y + height;
    ctx.beginPath();
    ctx.fillStyle = `#${color.toString(16)}`;
    ctx.lineWidth = "1";
    ctx.moveTo(x + radius, y);
    ctx.lineTo(r - radius, y);
    ctx.quadraticCurveTo(r, y, r, y + radius);
    ctx.lineTo(r, y + height - radius);
    ctx.quadraticCurveTo(r, b, r - radius, b);
    ctx.lineTo(x + radius, b);
    ctx.quadraticCurveTo(x, b, x, b - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();
    ctx.closePath();
  }

  function drawChart() {
    const parsedData = getInvestmentBins(data);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);
    const minX = 0;
    const maxX = parsedData.length;
    const xOffset = CHART_WIDTH / (maxX - minX);
    const minY = 0;
    const maxY = data.length;
    const yOffset = CHART_HEIGHT / (maxY - minY);

    parsedData.forEach(
      (item, index) =>
        item.y &&
        drawBar({
          ctx,
          x: index * xOffset,
          y: CHART_HEIGHT - item.y * yOffset,
          width: 8,
          height: item.y * yOffset,
          index,
        }),
    )
  }

  useEffect(() => {
    if (canvas) {
      drawChart();
    }
  });

  return (
    <React.Fragment>
      <canvas
        ref={csv => setCanvas(csv)}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
      />
    </React.Fragment>
  );
}

Chart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object)
};

Chart.defaultProps = {
  data: null
};

export default Chart;
