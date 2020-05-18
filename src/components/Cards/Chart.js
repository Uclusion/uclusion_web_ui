import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { CHART_HEIGHT, CHART_WIDTH } from '../../constants/global'
import { getInvestmentBins } from '../../utils/userFunctions'

function Chart(props) {
  const [canvas, setCanvas] = useState(null);
  const { data } = props;

  function drawBar(props) {
    const { ctx, x, y, width, height, color } = props;
    const radius = 3;
    var r = x + width;
    var b = y + height;
    ctx.beginPath();
    ctx.fillStyle = color;
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
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);
    const minX = 0;
    const maxX = parsedData.length;
    const xOffset = CHART_WIDTH / (maxX - minX);
    const minY = 0;
    const maxY = data.length;
    const yOffset = CHART_HEIGHT / (maxY - minY);
    const colors = {
      100: '#5ed635',
      75: '#90ee90',
      50: '#E3C941',
      25: '#F3771D',
      0: '#F5270F'
    };

    parsedData.forEach(
      (item, index) =>
        item.y &&
        drawBar({
          ctx,
          x: index * xOffset,
          y: CHART_HEIGHT - item.y * yOffset,
          width: 8,
          height: item.y * yOffset,
          color: colors[item.x]
        })
    );
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
