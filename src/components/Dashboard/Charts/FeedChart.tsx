import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ComposedChart, Bar, XAxis, Tooltip, Rectangle } from "recharts";
import { fetchFeedData } from "../../../redux/GanttReduces/feedSlice";
import { RootState, AppDispatch } from "../../../redux/store";
import moment from "moment";
import "../../../assets/css/FeedChart.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGreaterThan } from "@fortawesome/free-solid-svg-icons";
interface FeedChartProps {
  selectedHours: number;
  selectedMachine: string;
  chartWidth: number;
  timeTicks: number[];
  activeTooltipIndex: number | null;
  onMouseOver: (index: number) => void;
  onMouseOut: () => void;
}
interface FeedData {
  time: number;
  feed: number | null;
}
const generateTickValues = (start: number, end: number, interval: number): number[] => {
  const ticks: number[] = [];
  let current = moment(start);

  while (current.valueOf() <= end) {
    ticks.push(current.valueOf());
    current.add(interval, 'minutes');
  }

  return ticks;
};

const CustomLegend = () => {
  return (
    <div className="custom-legend">
      <div className="legend-item">
        <div
          className="color-box"
          style={{ backgroundColor: "rgba(255, 255, 0)" }}
        ></div>
        <span>{"< 100 (Feed Value)"}</span>
      </div>
      <div className="legend-item">
        <div
          className="color-box"
          style={{ backgroundColor: "rgba(0, 128, 0)" }}
        ></div>
        <span>{"= 100 (Feed Value)"}</span>
      </div>
      <div className="legend-item">
        <div
          className="color-box"
          style={{ backgroundColor: "rgba(255, 0, 0)" }}
        ></div>
        <span>{"> 100 (Feed Value)"}</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const speed = payload[0].value;
    const time = formatToHoursMinutes(label);

    return (
      <div className="custom-tooltip">
        <p className="speed-value">{`Speed: ${speed}`}</p>
        <p className="time-value">{`Time: ${time}`}</p>
      </div>
    );
  }
  return null;
};

const formatToHoursMinutes = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
const getColor = (value: number | null) => {
  if (value === null || value === undefined) {
    return "grey"; // Color for undefined or null values
  }

  if (value < 100) {
    return "rgba(255, 255, 0)"; // Yellow for values below 100
  } else if (value === 100) {
    return "rgba(0, 128, 0)"; // Green for value exactly 100
  } else {
    return "rgba(255, 0, 0)"; // Red for values above 100
  }
};

const FeedChart: React.FC<FeedChartProps> = ({
  selectedHours,
  selectedMachine,
  chartWidth,
  activeTooltipIndex, // Make sure this prop is passed down from the parent
  onMouseOver, // Make sure this prop is passed down from the parent
  onMouseOut,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const feedData = useSelector((state: RootState) => state.feed.data);
  const [chartData, setChartData] = useState<any[]>([]);

  const minBarWidth = 8;
  const calculatedBarWidth = chartWidth / (chartData.length || 1);
  const barWidth = Math.max(minBarWidth, calculatedBarWidth);

  const fetchData = useCallback(() => {
    dispatch(fetchFeedData({ hours: selectedHours, machine: selectedMachine }));
  }, [dispatch, selectedHours, selectedMachine]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000); // Adjust interval as needed

    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    console.log('feedData:', feedData); // Debugging line
    const fillGaps = (data: FeedData[]) => {
      // Convert time from string to timestamp and sort the data
      const sortedData = data
        .map((d) => ({
          ...d,
          time: moment(d.time).valueOf(), // Convert string time to timestamp
        }))
        .sort((a, b) => a.time - b.time); // Sort data by time
  
      const filledData: FeedData[] = [];
      const timeInterval = 60 * 1000; // 1 minute in milliseconds
  
      for (let i = 0; i < sortedData.length - 1; i++) {
        filledData.push(sortedData[i]);
  
        let currentTime = sortedData[i].time;
        const nextTime = sortedData[i + 1].time;
  
        // Dynamically create new data points for each time interval until the next point
        while (currentTime + timeInterval < nextTime) {
          currentTime += timeInterval;
          filledData.push({ ...sortedData[i], time: currentTime });
        }
      }
  
      // Add the last data point
      filledData.push(sortedData[sortedData.length - 1]);
  
      return filledData;
    };
  
    if (feedData && feedData.length > 0) {
      const newDataWithGapsFilled = fillGaps(feedData);
      console.log('No data available, resetting chartData');
      setChartData(newDataWithGapsFilled);
    } else {
      // Reset chartData to an empty array if no new data is available
      setChartData([]);
    }
  }, [feedData]);
  

  const [timeTicks, setTimeTicks] = useState<number[]>([]);
  useEffect(() => {
    const currentTime = moment().valueOf();
    const startTime = moment().subtract(selectedHours, 'hours').valueOf();

    const filteredData = feedData.filter(
      (item) => item.time >= startTime && item.time <= currentTime
    );

    const newTimeTicks = generateTickValues(startTime, currentTime, selectedHours);
    setTimeTicks(newTimeTicks); // Assuming setTimeTicks is a useState setter for timeTicks
  }, [feedData, selectedHours]);

  const calculateBarWidth = () => {
    const numberOfBars = chartData.length;
    const maxBarWidth = 0.5; // Adjust as needed
    return Math.max(chartWidth / numberOfBars - 1, maxBarWidth);
  };
  // const barWidth = calculateBarWidth();

  const CustomBarShape = (props: any) => {
    const { x, width, value, index } = props;
    let color = getColor(value);
    const isFirstBar = index === 0;
    const isLastBar = index === chartData.length - 1;
    // Instead of a fixed radius, we make it conditional based on the position in the dataset
    let radius = [0, 0, 0, 0]; // Default: no radius

    if (chartData.length === 1) {
      radius = [10, 10, 10, 10]; // Apply radius to all corners if only one bar
    } else {
      if (isFirstBar) {
        radius = [10, 0, 0, 10]; // Left side rounded for the first bar
      } else if (isLastBar) {
        radius = [0, 10, 10, 0]; // Right side rounded for the last bar
      }
    }
    const adjustedX = x - 3;
    const adjustedWidth = width;
    const fixedHeight = 30;
    const adjustedY = 30 - fixedHeight;

    
    return (
      <Rectangle
        {...props}
        onMouseOver={() => onMouseOver(props.index)} // Make sure to pass the index of the bar
        onMouseOut={onMouseOut}
        x={adjustedX}
        y={adjustedY}
        width={adjustedWidth + 2}
        height={fixedHeight}
        fill={color}
        // radius={radius}
      />
    );
  };

  const start = chartData.length > 0 ? chartData[0].time : moment().valueOf();
  const end =
    chartData.length > 0
      ? chartData[chartData.length - 1].time
      : moment().add(selectedHours, "hours").valueOf();
  const tickValues = generateTickValues(start, end, 2); // Adjust the interval as needed

  return (
    <div className="feed-chart-container">
      <h6>Feed-Data</h6>

      {chartData.length === 0 ? (
        <div className="no-data-message">
          Data is not available for this time period.
        </div>
      ) : (
        <>
          <ComposedChart
            width={chartWidth+9}
            height={60}
            data={chartData}
            margin={{ top: 1, right: 20, bottom: 0, left: 7 }}
            barSize={20}
            barGap={0}
            barCategoryGap={0}
            onMouseMove={(e) => {
              if (e.isTooltipActive && e.activeTooltipIndex !== undefined) {
                onMouseOver(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={onMouseOut}
          >
            <XAxis
               dataKey="time"
               type="number"
               domain={["dataMin", "dataMax"]}
               tickFormatter={(unixTime) => moment(unixTime).format("HH:mm")}
               ticks={tickValues}
               tick={{ fontSize: "9px" }}
            />

            <Tooltip
              content={<CustomTooltip />}
              active={activeTooltipIndex !== null}
              payload={
                activeTooltipIndex !== null &&
                activeTooltipIndex >= 0 &&
                activeTooltipIndex < chartData.length &&
                chartData[activeTooltipIndex].feed !== null
                  ? [
                      {
                        name: "Feed Speed",
                        value: chartData[activeTooltipIndex].feed as number, // You need to ensure this index is within the data array bounds
                      },
                    ]
                  : []
              }
              labelFormatter={(label) => formatToHoursMinutes(label)}
            />

            <Bar
              dataKey="feed"
              name="Feed Speed"
              barSize={barWidth}
              shape={<CustomBarShape />}
            />
          </ComposedChart>
          <CustomLegend />
        </>
      )}
    </div>
  );
};

export default FeedChart;
