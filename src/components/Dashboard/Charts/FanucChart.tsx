import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ComposedChart, Bar, XAxis, Tooltip, Rectangle } from "recharts";
import moment from "moment";
import { fetchFanucData } from "../../../redux/GanttReduces/fanucSlice";
import { RootState, AppDispatch } from "../../../redux/store";
import "../../../assets/css/FanucChart.css";

interface FanucChartProps {
  selectedHours: number;
  selectedMachine: string;
  chartWidth: number;
  timeTicks: number[]; // For common x-axis time scaling
  activeTooltipIndex: number | null; // For synchronized tooltips
  onMouseOver: (index: number) => void; // Mouse over handler
  onMouseOut: () => void; // Mouse out handler
  hoveredTime: number | null;
}

interface FanucData {
  time: number;
  run: number | null;
  isGap?: boolean; // New property to indicate a gap
}


const SummaryTable: React.FC<{ chartData: FanucData[] }> = ({ chartData }) => {
  let productiveTime = 0;
  let idleTime = 0;

  for (let i = 0; i < chartData.length - 1; i++) {
    const current = chartData[i];
    const next = chartData[i + 1];

    // Calculate the time difference between consecutive data points
    const timeDiff = (next.time - current.time) / 1000; // Convert to seconds

    if (current.run === 3) {
      productiveTime += timeDiff;
    } else if (current.run === 0) {
      idleTime += timeDiff;
    }
  }

  // Convert seconds to minutes and seconds
  const formatTime = (seconds:any) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  return (
    <table>
      <tbody>
        <tr>
          <td style={{ border: "1px solid #cccccc", fontSize: "smaller" }}>
            Total Productive Time: {formatTime(productiveTime)}
          </td>
          <td
            style={{
              textAlign: "right",
              border: "1px solid #cccccc",
              fontSize: "smaller",
            }}
          >
            Total Idle Time: {formatTime(idleTime)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};


interface Patch {
  start: number; // start time of the patch
  end: number; // end time of the patch
  run: number | null;
  duration: number; // duration in seconds
}

// Function to generate tick values
const generateTickValues = (start: number, end: number, interval: number): number[] => {
  const ticks: number[] = [];
  let current = moment(start);

  while (current.valueOf() <= end) {
    ticks.push(current.valueOf());
    current.add(interval, 'minutes');
  }

  return ticks;
};

const FanucChart: React.FC<FanucChartProps> = ({
  selectedHours,
  selectedMachine,
  chartWidth,
  hoveredTime,
  onMouseOver,
  onMouseOut,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const fanucData = useSelector(
    (state: RootState) => state.fanuc.data
  ) as FanucData[];
  console.log("Fanuc Data from Redux:", fanucData);

  const [chartData, setChartData] = useState<FanucData[]>([]);

  const fetchData = useCallback(() => {
    console.log("Selected Machine:", selectedMachine); // Log to check the selected machine
    dispatch(
      fetchFanucData({ hours: selectedHours, machine: selectedMachine })
    );
  }, [dispatch, selectedHours, selectedMachine]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fillGaps = (data: FanucData[], gapThreshold = 110 * 1000) => { // 1 minutes in milliseconds
    if (data.length === 0) return [];
  
    const sortedData = data.map(d => ({
      ...d,
      time: moment(d.time).valueOf(),
    })).sort((a, b) => a.time - b.time);
  
    const filledData: FanucData[] = [];
    for (let i = 0; i < sortedData.length; i++) {
      filledData.push(sortedData[i]);
      if (i < sortedData.length - 1) {
        const currentTime = sortedData[i].time;
        const nextTime = sortedData[i + 1].time;
  
        if (nextTime - currentTime > gapThreshold) {
          filledData.push({ time: currentTime + gapThreshold, run: null, isGap: true });
        }
      }
    }
  
    return filledData;
  };
  
  useEffect(() => {
    // Use fillGaps function to process data and fill gaps
    const newDataWithGapsFilled = fillGaps(fanucData);
    setChartData(newDataWithGapsFilled);
  }, [fanucData]); // Make sure this effect runs whenever fanucData changes

  // Assume setActiveTooltipIndex is passed as a prop if it's not, then define it locally using useState
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    // Function to find index based on hoveredTime
    const findIndexBasedOnTime = (
      hoverTime: number | null,
      data: FanucData[]
    ): number | null => {
      if (hoverTime === null) return null;
      return data.findIndex((item) =>
        moment(item.time).isSame(moment(hoverTime), "minute")
      );
    };

    // Update the activeTooltipIndex based on hoveredTime
    setActiveTooltipIndex(findIndexBasedOnTime(hoveredTime, chartData));
  }, [hoveredTime, chartData]);

  useEffect(() => {
    console.log("Fetched Fanuc Data:", fanucData); // Log to check the fetched data
    const currentTime = moment().valueOf();
    const startTime = moment().subtract(selectedHours, "hours").valueOf();

    const filteredData = fanucData.filter(
      (item) => item.time >= startTime && item.time <= currentTime
    );
    console.log("Filtered Chart Data:", filteredData); // Log to check the filtered data
    setChartData(filteredData);
  }, [fanucData, selectedHours]);

  const calculateBarWidth = () => {
    const numberOfBars = chartData.length;
    const maxBarWidth = 0.5; // Adjust as needed
    return Math.max(chartWidth / numberOfBars - 1, maxBarWidth);
  };
  const barWidth = calculateBarWidth();

  const [patches, setPatches] = useState<Patch[]>([]);

  useEffect(() => {
    const newPatches: Patch[] = [];
    let start = 0;

    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i].run !== chartData[i - 1].run) {
        const end = i - 1;
        newPatches.push({
          start: chartData[start].time,
          end: chartData[end].time,
          run: chartData[start].run,
          duration: (chartData[end].time - chartData[start].time) / 1000,
        });
        start = i;
      }
    }

    // Handle the last patch
    if (chartData.length > 0) {
      newPatches.push({
        start: chartData[start].time,
        end: chartData[chartData.length - 1].time,
        run: chartData[start].run,
        duration: chartData[chartData.length - 1].time - chartData[start].time,
      });
    }

    setPatches(newPatches);
  }, [chartData]);

  const CustomBarShape = (props: any) => {
    const { x, y, width, height, value, index, isGap } = props;
    let color;

    if (isGap) {
      color = "red"; // Red color for gaps
    } else if (value === 3) {
      color = "green";
    } else if (value === 0) {
      color = "yellow";
    } else {
      color = "orange"; // Grey for no data or other cases
    }

    const adjustedX = x - 5;

    const handleMouseOver = useCallback(() => {
      props.onMouseOver(props.index);
    }, [props]);

    return (
      <Rectangle
        {...props}
        onMouseOver={handleMouseOver}
        onMouseOut={props.onMouseOut}
        x={adjustedX}
        y={50 - 50}
        width={barWidth + 6}
        height={30}
        fill={color}
      />
    );
  };

  const ChartLegend: React.FC = () => (
    <div className="chart-legend">
      <div className="legend-item">
        <div className="color-box" style={{ backgroundColor: "#4CAF50" }}></div>
        Productive
      </div>
      <div className="legend-item">
        <div className="color-box" style={{ backgroundColor: "#FFFF00" }}></div>
        Idle
      </div>
      <div className="legend-item">
        <div className="color-box" style={{ backgroundColor: "#FFA500" }}></div>
        Other States
      </div>
      <div className="legend-item">
        <div className="color-box" style={{ backgroundColor: "red" }}></div>
        No Data
      </div>
    </div>
  );

  const [hoveredPatchDuration, setHoveredPatchDuration] = useState<
    number | null
  >(null);

  const getPatchDuration = (index: number): number => {
    const runValue = chartData[index]?.run;
    if (runValue === null) return 0;

    let duration = 1; // Start with the current bar's duration (1 minute)
    let currentTime = chartData[index].time;

    // Look backward to find the start of the patch
    for (let i = index - 1; i >= 0 && chartData[i].run === runValue; i--) {
      duration++;
    }

    // Look forward to find the end of the patch
    for (
      let i = index + 1;
      i < chartData.length && chartData[i].run === runValue;
      i++
    ) {
      duration++;
    }

    return duration; // Convert duration to seconds
  };


  const formatDuration = (seconds:any) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };
  
  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      let labelContent;
  
      switch (value) {
        case 3:
          labelContent = "Productive";
          break;
        case 0:
          labelContent = "Idle";
          break;
        case null:
          labelContent = "No Data";
          break;
        default:
          labelContent = "Other States";
      }
  
      const time = moment(label).format("HH:mm:ss");
      const durationContent = hoveredPatchDuration
        ? formatDuration(hoveredPatchDuration)
        : "";
  
      return (
        <div className="custom-tooltip" >
          <p className="label">{`${labelContent} at ${time}`}</p>
          {hoveredPatchDuration !== null && (
            <p className="duration">{`Duration: ${durationContent}`}</p>
          )}
        </div>
      );
    }
  
    return null;
  };
  
  const CustomTick = (props: any) => {
    // Adjust the appearance of the ticks as needed
    const { x, y, payload } = props;

    return (
      <g transform={`translate(${x},${y})`}>
        <line y2={5} stroke="#888" />
      </g>
    );
  };

  // Assuming chartData is sorted by time
  const start = chartData.length > 0 ? chartData[0].time : moment().valueOf();
  const end =
    chartData.length > 0
      ? chartData[chartData.length - 1].time
      : moment().add(1, "hour").valueOf();
  const tickValues = generateTickValues(start, end, 2);

  return (
    <div className="fanuc-chart-container">
      <h6>Machine-Uptime Data</h6>

      {chartData.length === 0 ? (
        <div className="no-data-message">
          Data is not available for this time period.
        </div>
      ) : (
        <>
          <ComposedChart
            width={chartWidth + 5}
            height={60}
            data={chartData}
            margin={{ top: 1, right: 17, bottom: 0, left: 10 }}
            onMouseMove={(e) => {
              const activeIndex = e.activeTooltipIndex;
              // Only call setActiveTooltipIndex if activeIndex is a number
              if (typeof activeIndex === "number") {
                setActiveTooltipIndex(activeIndex);
                const duration = getPatchDuration(activeIndex);
                setHoveredPatchDuration(duration);
              } else {
                // If activeIndex is undefined, reset the tooltip index
                setActiveTooltipIndex(null);
                setHoveredPatchDuration(null);
              }
            }}
            onMouseLeave={() => {
              setActiveTooltipIndex(null);
              setHoveredPatchDuration(null);
            }}
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
                chartData[activeTooltipIndex].run !== null
                  ? [
                      {
                        name: "Run",
                        value: chartData[activeTooltipIndex].run as number,
                      },
                    ]
                  : []
              }
              // labelFormatter={(label) => moment(label).format("HH:mm:ss")}
            />

            <Bar
              dataKey="run"
              fill="#8884d8"
              shape={
                <CustomBarShape
                  onMouseOver={onMouseOver}
                  onMouseOut={onMouseOut}
                />
              }
              barSize={barWidth}
            />
          </ComposedChart>
        </>
      )}
      <SummaryTable chartData={chartData} />
      <ChartLegend />
    </div>
  );
};

export default FanucChart;



