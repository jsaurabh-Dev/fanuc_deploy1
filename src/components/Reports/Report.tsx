import { addDays, format, isAfter, subDays } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { useParams } from "react-router-dom";
import { cn } from "../../@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../@/components/ui/popover";
import { Button } from "../../@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../../@/components/ui/calendar";
import jsPDF from "jspdf";
import Top_Logo from "../../assets/images/pdfReport/topbrand.jpg";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../@/components/ui/dropdown-menu";
import DailyOee from "./MonthlyReport/DailyOee";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DailyProduction from "./MonthlyReport/DailyProduction";
import axios from "axios";
interface CustomLabelProps {
  fill: string;
  stroke: string;
}

interface ApiResponse {
  message: string;
  machineData: MachineData[];
}

interface MachineData {
  startDate: string;
  endDate: string;
  reportTime: number;
  machineON: number;
  rejectionQuantity: number;
  actualProduction: number;
  productionTime: number;
  idleTime: number;
  production: number;
  availability: number;
  performance: number;
  quality: number;
  OEE: number;
  targetProduction: number;
}

interface CycleData {
  srno: number;
  machineid: string;
  starttime: string;
  endtime: string;
  idleDuration: number;
  productionDuration: number;
}
interface CycleApiResponse {
  status: string;
  code: number;
  message: string;
  data: CycleData[];
}

export default function Report({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const { selectedMachine } = useParams<{ selectedMachine: string }>();
  const [date, setDate] = React.useState<Date>(new Date());
  const [position, setPosition] = React.useState("4");
  const [startDate, setStartDate] = useState<string | undefined>();
  const [totalProductiveTime, setTotalProductiveTime] = useState(0);
  const [totalIdleTime, setTotalIdleTime] = useState(0);
  //   const [date, setDate] = React.useState<DateRange | undefined>({
  //     from: subDays(new Date(), 1),
  //     to: new Date(),
  //   });

  const [displayStartDate, setDisplayStartDate] = React.useState<
    string | undefined
  >();
  const [displayEndDate, setDisplayEndDate] = React.useState<
    string | undefined
  >();

  //   useEffect(() => {
  //     if (date?.from && date?.to) {
  //       setDisplayStartDate(format(date.from, "yyyy-MM-dd'T'HH:mm:ss'Z'"));
  //       setDisplayEndDate(
  //         date.to ? format(date.to, "yyyy-MM-dd'T'HH:mm:ss'Z'") : undefined
  //       );
  //     }
  //   }, [date]);

  const [data, setData] = useState<MachineData[]>([]);
  const [sumReportTime, setSumReportTime] = useState<number>(0);
  const [sumIdleTime, setSumIdleTime] = useState<number>(0);
  const [sumProduction, setSumProduction] = useState<number>(0);
  const [sumAvailability, setSumAvailability] = useState<number>(0);
  const [sumPerformance, setSumPerformance] = useState<number>(0);
  const [sumQuality, setSumQuality] = useState<number>(0);
  const [sumOEE, setSumOEE] = useState<number>(0);
  const [sumTargetProduction, setSumTargetProduction] = useState<number>(0);
  const [sumMachineOn, setSumMachineOn] = useState<number>(0);
  const [averageOEE, setAverageOEE] = useState<number>(0);
  const [productionTime, setProductionTime] = useState<number>(0);
  const [dataFetched, setDataFetched] = useState(false);
  const [cycleResponseData, setCycleResponseData] = useState<CycleData[]>([]);

  useEffect(() => {
    if (date) {
      setDisplayStartDate(format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'"));
    }
  }, [date]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        let startDate;

        // Calculate start date based on the selected report range
        if (position === "4") {
          // Daily: 1 day before the selected date
          startDate = format(addDays(date, -1), "yyyy-MM-dd'T'HH:mm:ss'Z'");
        } else if (position === "24") {
          // Weekly: 7 days before the selected date
          startDate = format(addDays(date, -7), "yyyy-MM-dd'T'HH:mm:ss'Z'");
        } else if (position === "168") {
          // Monthly: 30 days before the selected date
          startDate = format(addDays(date, -30), "yyyy-MM-dd'T'HH:mm:ss'Z'");
        }
        setStartDate(startDate);
        const response = await axios.post<ApiResponse>(
          "http://13.200.129.119:3000/v1/controllerdata/createPdf",

          {
            startDate: startDate,
            endDate: displayStartDate,
            machineName: selectedMachine,
            interval: parseInt(position),
          }
        );

        const cycleResponse = await axios.post<CycleApiResponse>(
          "http://13.200.129.119:3000/v1/fanuc/cycleData",
          {
            startDate: startDate,
            endDate: displayStartDate,
            machineName: selectedMachine,
          }
        );
        console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
        console.log(startDate);
        console.log(displayStartDate);
        console.log(position);
        setData(response.data.machineData);
        console.log(response.data.machineData);
        setCycleResponseData(cycleResponse.data.data);

        // Calculate sums and set state variables
        setSumReportTime(
          response.data.machineData.reduce(
            (acc, item) => acc + item.reportTime,
            0
          )
        );
        setSumIdleTime(
          response.data.machineData.reduce(
            (acc, item) => acc + item.idleTime,
            0
          )
        );
        setProductionTime(
          response.data.machineData.reduce(
            (acc, item) => acc + item.productionTime,
            0
          )
        );

        setSumMachineOn(
          response.data.machineData.reduce(
            (acc, item) => acc + item.machineON,
            0
          )
        );
        setSumProduction(
          response.data.machineData.reduce(
            (acc, item) => acc + item.production,
            0
          )
        );

        setSumQuality(
          response.data.machineData.reduce((acc, item) => acc + item.quality, 0)
        );
        setSumOEE(
          response.data.machineData.reduce((acc, item) => acc + item.OEE, 0)
        );
        setSumTargetProduction(
          response.data.machineData.reduce(
            (acc, item) => acc + item.targetProduction,
            0
          )
        );

        // Calculate average OEE & Availability
        const numMachines = response.data.machineData.length;
        const totalOEE = response.data.machineData.reduce(
          (acc, item) => acc + item.OEE,
          0
        );
        setAverageOEE(totalOEE / numMachines);

        const totalAvailavility = response.data.machineData.reduce(
          (acc, item) => acc + item.availability,
          0
        );
        setSumAvailability(totalAvailavility / numMachines);

        const totalPerformance = response.data.machineData.reduce(
          (acc, item) => acc + item.performance,
          0
        );
        setSumPerformance(totalPerformance / numMachines);
        setDataFetched(true);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [displayStartDate, position]);

  const summaryTable = useRef<any>(null);
  const dailyOee = useRef<any>(null);
  const downimeAnalysis = useRef<any>(null);
  const pieChart = useRef<any>(null);

  //  generate pdf function
  const generatePdf = async () => {
    const doc = new jsPDF({ format: "a4", compress: true });

    if (Top_Logo) {
      let logo = new Image();
      logo.src = Top_Logo;
      doc.addImage(logo, "PNG", 0, 0, 210, 50);
    }

    doc.setFontSize(14);
    doc.text("OEE Report", 105, 60, { align: "center" });

    if (summaryTable.current) {
      let summaryTableRef = await html2canvas(summaryTable.current);
      doc.addImage(summaryTableRef, "PNG", 0, 50, 210, 74.25);
    }

    if (dailyOee.current) {
      let dailyOeeRef = await html2canvas(dailyOee.current);
      doc.addImage(dailyOeeRef, "PNG", 0, 124.25, 210, 74.25);
    }

    if (downimeAnalysis.current) {
      let downimeAnalysisRef = await html2canvas(downimeAnalysis.current);
      doc.addImage(downimeAnalysisRef, "PNG", 0, 198.5, 210, 90);
    }

    // if (ganntCharts.current) {
    //   doc.addPage();
    //   let ganntChartsRef = await html2canvas(ganntCharts.current);
    //   doc.addImage(ganntChartsRef, "PNG", 0, 0, 210, 100);
    // }

    if (pieChart.current) {
      doc.addPage();
      let pieChartRef = await html2canvas(pieChart.current);
      doc.addImage(pieChartRef, "PNG", 0, 0, 210, 80);
    }

    autoTable(doc, {
      html: "#cycleTable", // Use the ID of your table
      startY: 90, // Adjust the starting Y position as needed
      theme: "grid", // You can change the theme if needed
      styles: { halign: "center" }, // Center-align the content
      margin: { top: 10 }, // Adjust margins if needed
    });

    const pageCount = doc.internal.pages.length || 1;

    for (let i = 1; i < pageCount; i++) {
      doc.setPage(i);

      // Add a background strip
      doc.setFillColor(200, 200, 200); // Gray color
      doc.rect(
        0,
        doc.internal.pageSize.height - 10,
        doc.internal.pageSize.width,
        15,
        "F"
      );

      // Add text on the strip
      doc.setFontSize(10);
      doc.setTextColor(0); // White color 255
      doc.text(
        `Copyright © MachineWise Monitor & Improve ${new Date().getFullYear()}`,
        10,
        doc.internal.pageSize.height - 5
      );

      // Add page count at the right side of the footer
      doc.text(
        `Page ${i} of ${pageCount - 1}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 5,
        { align: "right" }
      );
    }

    doc.save(`${selectedMachine}_machine_report.pdf`);
  };

  // pie chart
  const COLORS = ["#C3ACD0", "#B0926A"];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  return (
    <div>
      {/* date picker */}
      <div className="flex items-center space-x-4 mx-4 mt-4">
        <span className="font-bold"> Select Start Date : </span>
        {/* <div className={cn("grid gap-2", className)}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[19vw] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                modifiers={{
                  // Disable dates that are after today
                  disabled: (day) => isAfter(day, new Date()),
                }}
              />
            </PopoverContent>
          </Popover>

        </div> */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate: Date | undefined) => {
                if (newDate) {
                  setDate(newDate);
                }
              }}
              initialFocus
              modifiers={{
                // Disable dates that are after today
                disabled: (day) => isAfter(day, new Date()),
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Dropdown */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Select Report Range :
              {position === "4"
                ? " Daily"
                : position === "24"
                ? " Weekly"
                : position === "168"
                ? " Monthly"
                : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={position}
              onValueChange={setPosition}
            >
              <DropdownMenuRadioItem id="top" value="4">
                Daily
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem id="top" value="24">
                Weekly
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem id="top" value="168">
                Monthly
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* download pdf button (conditionally rendered)*/}
        {dataFetched && (
          <Button variant={"destructive"} onClick={generatePdf}>
            Export as PDF
          </Button>
        )}
      </div>

      {/* summary table */}
      <div
        ref={summaryTable}
        className="max-w-screen-lg mx-auto  p-4 rounded-md   "
      >
        <table className="table-auto w-full ">
          <thead>
            <tr>
              <th
                colSpan={3}
                className="text-lg font-bold border-b  border-black px-4 py-2 text-center"
              >
                SUMMARY
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-solid border-1 border-black px-4 py-2  ">
                <span className="font-bold"> Start Date : </span>
                {startDate ? (
                  <>
                    {new Date(startDate)
                      .toLocaleString("en-US", {
                        timeZone: "UTC",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      .replace(/(\d+)\/(\d+)\/(\d+),/, "$2/$1/$3")}
                  </>
                ) : (
                  "N/A"
                )}
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold">Machine Name :</span>{" "}
                {selectedMachine}
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> End Date : </span>
                {displayStartDate ? (
                  <>
                    {new Date(displayStartDate)
                      .toLocaleString("en-US", {
                        timeZone: "UTC",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      .replace(/(\d+)\/(\d+)\/(\d+),/, "$2/$1/$3")}
                  </>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
            <tr>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Total Hour : </span>{" "}
                {formatTime(sumReportTime)}
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> OEE : </span>{" "}
                {averageOEE.toFixed(2)} %
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Production : </span>
                {sumProduction} No's
              </td>
            </tr>
            <tr>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Machine Ontime :</span>{" "}
                {formatTime(sumMachineOn)}
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Avalibility : </span>
                {(sumAvailability * 100).toFixed(2)} %
                {/* Avalibility : 100 % */}
              </td>
              <td className="border-1 border-black px-4 py-2">
                <span className="font-bold"> Target Production : </span>
                {sumTargetProduction}
              </td>
            </tr>
            <tr>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Productive Time : </span>
                {formatTime(productionTime)}
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Performance : </span>
                {(sumPerformance * 100).toFixed(2)} %
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Rejection Qty: </span> N/A
              </td>
            </tr>
            <tr>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Idel Time : </span>
                {formatTime(sumIdleTime)}
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Quality Rate : </span> 100 %
              </td>
              <td className="border-1 border-black px-4 py-2 ">
                <span className="font-bold"> Actual Production: </span>
                {sumProduction} No's
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Daily OEE */}

      <div ref={dailyOee} className="max-w-screen-lg mx-auto  p-4 rounded-md ">
        <div className="text-2xl font-bold mb-4 text-center">
          DAILY OEE ANALYSIS
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="startDate"
              tickFormatter={(tick) =>
                position === "4"
                  ? tick.split("T")[1].slice(0, 5)
                  : tick.split("T")[0]
              }
              interval={0}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => (
                <span style={{ color: "red" }}>Date: {value}</span>
              )}
              formatter={(value) => `${Number(value).toFixed(2)}%`}
            />{" "}
            <Legend />
            <Bar
              // dataKey="performance"
              dataKey={(data) => data.performance * 100}
              name="Performance"
              fill="#8884d8"
              label={<CustomLabel fill="gold" stroke="purple" />} // Use label for customization
            />
            <Bar
              // dataKey="availability"
              dataKey={(data) => data.availability * 100}
              name="Availability"
              fill="#82ca9d"
              label={<CustomLabel fill="gold" stroke="purple" />} // Use label for customization
            />
            <Bar
              dataKey="OEE"
              fill="#61A3BA"
              label={<CustomLabel fill="gold" stroke="purple" />} // Use label for customization
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/*  PRODUCTIVE VS IDLE TIME */}

      <div
        ref={downimeAnalysis}
        className="max-w-screen-lg mx-auto  p-4 rounded-md "
      >
        <div className="text-2xl font-bold mb-4 text-center">
          PRODUCTIVE VS IDLE TIME
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="startDate"
              tickFormatter={(tick) =>
                position === "4"
                  ? tick.split("T")[1].slice(0, 5)
                  : tick.split("T")[0]
              }
            />
            <YAxis
              tickFormatter={(value) => {
                const hours = Math.floor(value / 3600);
                const minutes = Math.floor((value % 3600) / 60);
                return `${hours}h ${minutes}m`;
              }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="productionTime"
              stroke="#00ff00"
            />{" "}
            <Line
              type="monotone"
              dataKey="idleTime"
              stroke="#ff0000"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <table className="w-full table-auto">
          <tbody>
            <tr>
              <td className="border text-center py-2">
                {" "}
                Total Productive Time
              </td>
              <td className="border text-center py-2">
                {formatTime(productionTime)}
              </td>
            </tr>
            <tr>
              <td className="border text-center py-2"> Total Idle Time</td>
              <td className="border text-center py-2">
                {" "}
                {formatTime(sumIdleTime)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* productionTime vs IdealTime */}

      <div ref={pieChart} className="max-w-screen-lg mx-auto  p-4 rounded-md  ">
        <div className="text-2xl font-bold mb-4 text-center">
          PRODUCTION OVERVIEW
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: "Idle Time", value: sumIdleTime },
                { name: "Production Time", value: productionTime },
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Cycle Data table */}
      <div className="max-w-screen-lg mx-auto  p-4 rounded-md ">
        <table className="table-auto w-full border-4" id="cycleTable">
          <thead>
            <tr>
              <th
                colSpan={5}
                className="text-lg font-bold border-b px-4 py-2 text-center bg-gray-200"
              >
                Cycle Data
              </th>
            </tr>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Sr. No</th>
              <th className="px-4 py-2">Start Time</th>
              <th className="px-4 py-2">End Time</th>
              <th className="px-4 py-2">Production Duration (minutes)</th>
              <th className="px-4 py-2">Idle Duration (minutes)</th>
            </tr>
          </thead>
          <tbody>
            {cycleResponseData.map((data, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">
                  {format(new Date(data.starttime), "yyyy/MM/dd HH:mm:ss.SSS")}
                </td>
                <td className="px-4 py-2">
                  {format(new Date(data.endtime), "yyyy/MM/dd HH:mm:ss.SSS")}
                </td>
                <td className="px-4 py-2">
                  {data.productionDuration &&
                    formatTime(data.productionDuration)}
                </td>
                <td className="px-4 py-2">
                  {data.idleDuration && formatTime(data.idleDuration)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CustomLabel: React.FC<CustomLabelProps> = ({ fill, stroke }) => (
  <text x="50%" y="50%" fill={fill} stroke={stroke} dy={-6} textAnchor="middle">
    {/* You can customize the label content here */}
  </text>
);
// Function to convert seconds to hours and minutes format
const formatTime = (productionTime: number) => {
  const hours = Math.floor(productionTime / 3600);
  const minutes = Math.floor((productionTime % 3600) / 60);

  // You can further customize the format as needed
  return `${hours}h ${minutes}m`;
};
