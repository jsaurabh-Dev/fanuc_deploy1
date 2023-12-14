import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ComposedChart,
  Bar,
  XAxis,
  Tooltip,
  Rectangle,
  ResponsiveContainer,
} from "recharts";
import moment from "moment";
import { fetchPartTimelineData } from "../../../redux/GanttReduces/partTimelineSlice";
import { RootState, AppDispatch } from "../../../redux/store";
import "../../../assets/css/PartTimelineChart.css";

interface PartTimelineChartProps {
  selectedHours: number;
  selectedMachine: string;
  chartWidth: number;
  timeTicks: number[];
  activeTooltipIndex: number | null;
  onMouseOver: (index: number) => void;
  onMouseOut: () => void;
  hoveredTime: number | null;
}
interface ColorMap {
  [name: string]: string;
}

const generateTickValues = (
  start: number,
  end: number,
  interval: number
): number[] => {
  const ticks: number[] = [];
  let current = moment(start);

  while (current.valueOf() <= end) {
    ticks.push(current.valueOf());
    current.add(interval, "minutes");
  }

  return ticks;
};

const PartTimelineChart: React.FC<PartTimelineChartProps> = ({
  selectedHours,
  selectedMachine,
  chartWidth,
  hoveredTime,
  activeTooltipIndex,
  onMouseOver,
  onMouseOut,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const rawPartData = useSelector(
    (state: RootState) => state.partTimeline.data
  );
  const [mergedData, setMergedData] = useState<any[]>([]);
  // const [colorMap, setColorMap] = useState<ColorMap>({});
  const colorMapRef = useRef<ColorMap>({});
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(
    () => moment(endDate).subtract(selectedHours, "hours").toDate(),
    [selectedHours, endDate]
  );

  const isHovered = (dataPointTime: number): boolean => {
    return hoveredTime === dataPointTime;
  };

  const getColorMap = useCallback((data: any[]) => {
    const colors = [
      "#0088FE",
      "#00C49F",
      "#FFBB28",
      "#FF8042",
      "#8884d8",
      "#A55D35",
      "#D0B7B1",
      "#A58FAA",
      "#DDA0DD",
      "#5F9EA0",
    ];
    let colorIndex = Object.keys(colorMapRef.current).length;

    data.forEach((item) => {
      const comment = item.state.data.program.current.comment;
      if (!colorMapRef.current[comment]) {
        colorMapRef.current[comment] = colors[colorIndex % colors.length];
        colorIndex++;
      }
    });
  }, []);

  const fetchData = useCallback(() => {
    dispatch(
      fetchPartTimelineData({
        hours: selectedHours,
        machine: selectedMachine,
        observationName: "production",
      })
    );
  }, [dispatch, selectedHours, selectedMachine]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000); // Fetch data every 1 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (rawPartData && rawPartData.length > 0) {
      getColorMap(rawPartData);
      // Directly use rawPartData if you still need to process it
      // Otherwise, just set mergedData to rawPartData
      setMergedData(rawPartData);
    } else {
      // Set mergedData to an empty array if no data is available
      setMergedData([]);
    }
  }, [rawPartData, selectedHours, startDate, endDate]);

  const generatePlaceholderData = () => {
    const data = [];
    let currentTime = startDate;
    while (currentTime <= endDate) {
      // Adding 'UNAVAILABLE' or similar as a default name property
      data.push({
        observation: { time: currentTime.getTime() },
        state: {
          data: {
            program: { current: { name: "UNAVAILABLE", comment: "default" } },
          },
        },
      });
      currentTime = moment(currentTime).add(1, "minute").toDate();
    }
    return data;
  };

  const mergeData = (placeholderData: any[], actualData: any[]) => {
    // Find the first actual data point, or use a default if none exists
    const firstActualDataPoint =
      actualData.find(
        (d) => d.state.data.program.current.comment !== "default"
      ) || actualData[0];

    let lastKnownComment = firstActualDataPoint
      ? firstActualDataPoint.state.data.program.current.comment
      : "default";

    return placeholderData.map((placeholder) => {
      const match = actualData.find((data) =>
        moment(data.observation.time).isSame(
          placeholder.observation.time,
          "minute"
        )
      );

      if (match) {
        lastKnownComment = match.state.data.program.current.comment;
        return match;
      } else {
        return {
          ...placeholder,
          state: {
            ...placeholder.state,
            data: {
              ...placeholder.state.data,
              program: {
                ...placeholder.state.data.program,
                current: {
                  ...placeholder.state.data.program.current,
                  comment: lastKnownComment,
                },
              },
            },
          },
        };
      }
    });
  };

  useEffect(() => {
    dispatch(
      fetchPartTimelineData({
        hours: selectedHours,
        machine: selectedMachine,
        observationName: "production",
      })
    );
  }, [dispatch, selectedMachine, selectedHours]);

  const formatToHoursMinutes = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      // Check if the name exists or use "UNAVAILABLE" as a fallback
      const name = dataItem.state.data.program?.current?.name || "UNAVAILABLE";
      // You could also include a default comment or other property if you wish
      const comment =
        dataItem.state.data.program?.current?.comment || "No comment available";
      const fullDate = new Date(dataItem.observation.time);
      const formattedDate = fullDate.toLocaleDateString();
      const formattedTime = formatToHoursMinutes(dataItem.observation.time);
      return (
        <div className="custom-tooltip">
          <p className="label">{`Part-Name: ${comment}`}</p>
          <p className="label">{`Date: ${formattedDate}`}</p>
          <p className="label">{`Time: ${formattedTime}`}</p>
        </div>
      );
    }
    return null;
  };

  const calculateBarWidth = () => {
    const maxBarWidth = 180; // Maximum width of a bar in pixels
    const minBarWidth = 1200; // Minimum width of a bar in pixels
    const numBars = mergedData.length;
    const chartContainerWidth = chartWidth -100; // Adjust this based on your chart's margins

    let barWidth = chartContainerWidth / numBars;
    barWidth = Math.max(Math.min(barWidth, maxBarWidth), minBarWidth);

    return barWidth;
  };

  const barWidth = calculateBarWidth();

  const CustomBarShape: React.FC<any> = (props) => {
    const { fill, x, width, index, totalBars } = props;
    // const fillColor =
    //   commentToColorMap[comment] || commentToColorMap["default"];
    const comment = props.payload.state.data.program.current.comment;
    const fillColor = colorMapRef.current[comment] || "#d38181";
    const isFirstBar = index === 0;
    const isLastBar = index === totalBars - 1;

    // Define the bar radius based on position
    let radius = [0, 0, 0, 0]; // Default: no radius
    if (totalBars === 1) {
      radius = [10, 10, 10, 10];
    } else if (isFirstBar) {
      radius = [10, 0, 0, 10]; // Left side rounded for the first bar
    } else if (isLastBar) {
      radius = [0, 10, 10, 0]; // Right side rounded for the last bar
    }
    const adjustedWidth = barWidth;
    const adjustedX = x;

    return (
      <Rectangle
        {...props}
        x={adjustedX}
        y={5}
        width={adjustedWidth+3}
        height={30}
        fill={fill}
        // radius={radius}
      />
    );
  };

  const CustomLegend = () => (
    <div className="custom-legend">
      {Object.entries(colorMapRef.current).map(([comment, color]) => (
        <div key={comment} className="legend-item">
          <span
            className="legend-color-box"
            style={{
              background: color,
              display: "inline-block",
              width: "7px",
              height: "9px",
              marginRight: "5px",
            }}
          ></span>
          <span className="legend-text" style={{ fontSize: "9px" }}>
            {comment}
          </span>
        </div>
      ))}
    </div>
  );

  const tickInterval = 2; // interval in minutes
  // Assuming mergedData is sorted by time
  const start = mergedData.length > 0 ? mergedData[0].observation.time : moment().valueOf();
const end = mergedData.length > 0 ? mergedData[mergedData.length - 1].observation.time : moment().add(selectedHours, "hours").valueOf();

// Generate the tick values with the updated interval
const tickValues = generateTickValues(start, end, tickInterval);

  return (
    <div className="part-timeline-chart-container">
      <h6>Part-Name Data</h6>
      {mergedData.length === 0 ? (
        <div className="no-data-message">
          Data is not available for this time period.
        </div>
      ) : (
        <>
          <div style={{ width: chartWidth-8, height: "100%" }}>
            <ResponsiveContainer width="100%" height={62}>
              <ComposedChart
                barGap={0}
                barCategoryGap={0}
                data={mergedData}
                margin={{ top: 1, right: 10, bottom: 0, left: 0 }}
              >
                <XAxis
                  dataKey="observation.time"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={formatToHoursMinutes}
                  ticks={tickValues}
                  tick={{ fontSize: "9px" }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  active={activeTooltipIndex !== null ? true : undefined}
                  cursor={{ fill: "transparent" }} // To avoid the default highlight box when hovering over bars
                />

                <Bar
                  dataKey="state.data.program.current.comment"
                  shape={(props) => (
                    <CustomBarShape
                      {...props}
                      fill={
                        colorMapRef.current[
                          props.payload.state.data.program.current.comment
                        ] || "#d38181"
                      }
                      totalBars={mergedData.length}
                      onMouseOver={() => onMouseOver(props.index)}
                      onMouseOut={onMouseOut}
                    />
                  )}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      <CustomLegend />
    </div>
  );
};

export default PartTimelineChart;
