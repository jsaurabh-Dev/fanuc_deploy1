import React, { useCallback, useEffect, useState } from "react";
import CommonTimeAxis from "../Dashboard/Charts/CommonTimeAxis";
import moment from "moment";
import FanucChart from "../Dashboard/Charts/FanucChart";
import FeedChart from "../Dashboard/Charts/FeedChart";
import PartTimelineChart from "../Dashboard/Charts/PartTimelineChart";

interface GanttProps {
  selectedMachine: string;
}
export default function Gantt({ selectedMachine }: GanttProps) {
  const machine = selectedMachine;
  const [selectedHours, setSelectedHours] = useState<number>(24);
  const [timeTicks, setTimeTicks] = useState<number[]>([]);
  const [chartWidth, setChartWidth] = useState<number>(500);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(
    null
  );

  const handleTimeHover = useCallback((hoverIndex: number | null) => {
    setActiveTooltipIndex(hoverIndex); // This index is then passed down to FanucChart
  }, []);

  const handleMouseOverOnChart = (index: number) => {
    setActiveTooltipIndex(index);
  };

  const handleMouseOutFromChart = () => {
    setActiveTooltipIndex(null);
  };

  useEffect(() => {
    const updateTimeTicks = () => {
      const tickInterval = 30;
      const endTime = moment().tz("UTC").seconds(0).milliseconds(0);
      const startTime = moment(endTime).subtract(selectedHours, "hours");

      const ticks: number[] = []; // Define ticks array with type
      while (startTime <= endTime) {
        ticks.push(startTime.valueOf());
        startTime.add(tickInterval, "minutes");
      }
      setTimeTicks(ticks);
    };

    updateTimeTicks();
    const intervalId = setInterval(updateTimeTicks, 60000 * 30);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const container = document.querySelector(".chart-wrapper");
      if (container) {
        setChartWidth(container.clientWidth);
      }
      if (window.innerWidth <= 768) {
        setSelectedHours(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (hoveredTime !== null) {
      // Let's say your chart data points are in sync with timeTicks, you'll find the index like this:
      const index = timeTicks.findIndex((tick) => tick === hoveredTime);
      setActiveTooltipIndex(index); // Set the state that FanucChart can use to control tooltip visibility
    } else {
      setActiveTooltipIndex(null); // Hide tooltip when not hovering
    }
  }, [hoveredTime, timeTicks]);

  return (
    <div>
      <div className="chart-wrapper">
        <CommonTimeAxis
          timeTicks={timeTicks}
          chartWidth={chartWidth}
          onHover={handleTimeHover} // Update this to handle index-based hover
        />

        <FanucChart
          selectedHours={selectedHours}
          selectedMachine={machine}
          chartWidth={chartWidth}
          timeTicks={timeTicks} // Pass timeTicks for common x-axis scaling
          activeTooltipIndex={activeTooltipIndex} // Pass active tooltip index for synchronization
          onMouseOver={handleMouseOverOnChart} // Pass mouse over handler
          onMouseOut={handleMouseOutFromChart} // Pass mouse out handler
          hoveredTime={hoveredTime}
        />

        <FeedChart
          selectedHours={selectedHours}
          selectedMachine={machine}
          chartWidth={chartWidth}
          timeTicks={timeTicks} // Pass timeTicks for common x-axis scaling
          activeTooltipIndex={activeTooltipIndex} // Pass active tooltip index for synchronization
          onMouseOver={handleMouseOverOnChart} // Pass mouse over handler
          onMouseOut={handleMouseOutFromChart} // Pass mouse out handler
          // hoveredTime={hoveredTime}
        />

        <PartTimelineChart
          selectedHours={selectedHours}
          selectedMachine={machine}
          chartWidth={chartWidth}
          timeTicks={timeTicks} // Pass timeTicks for common x-axis scaling
          activeTooltipIndex={activeTooltipIndex} // Pass active tooltip index for synchronization
          onMouseOver={handleMouseOverOnChart} // Pass mouse over handler
          onMouseOut={handleMouseOutFromChart} // Pass mouse out handler
          hoveredTime={hoveredTime}
        />
      </div>
    </div>
  );
}
