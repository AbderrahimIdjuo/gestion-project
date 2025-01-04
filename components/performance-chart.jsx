"use client";

import { subDays, format } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Generate mock data for the current month and last month
const generateData = () => {
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, "dd"),
      thisMonth: Math.floor(Math.random() * 10) + 2,
      lastMonth: Math.floor(Math.random() * 10) + 2,
    });
  }
  return data;
};

const data = generateData();

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-[#0f1729] p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-gray-400">
              This month
            </span>
            <span className="font-bold text-gray-100">{payload[0].value}h</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-gray-400">
              Last month
            </span>
            <span className="font-bold text-gray-100">{payload[1].value}h</span>
          </div>
        </div>
        <div className="mt-2 text-xs font-medium text-gray-400">
          {format(new Date(), "dd MMM yyyy")}
        </div>
      </div>
    );
  }
  return null;
};

export function PerformanceChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-base font-normal">Performance</CardTitle>
        <Select defaultValue="this-week">
          <SelectTrigger className="w-[160px] bg-gray-50">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">01-07 May</SelectItem>
            <SelectItem value="last-week">24-30 Apr</SelectItem>
            <SelectItem value="last-2-weeks">17-23 Apr</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}h`}
              domain={[0, 12]}
              ticks={[0, 2, 4, 6, 8, 10, 12]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#888888", strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone"
              dataKey="thisMonth"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#2563eb" }}
            />
            <Line
              type="monotone"
              dataKey="lastMonth"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#f97316" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
