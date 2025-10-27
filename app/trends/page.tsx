"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TrendsPage() {

  // Example dummy data — replace this later with backend data
  const weeklyTrends = {
    weeks: ["Week 1", "Week 2", "Week 3", "Week 4"],
    total_calls: [100, 150, 200, 180],
    connected_calls: [40, 70, 90, 80],
    voicemail_calls: [30, 40, 60, 50],
    no_answer_calls: [30, 40, 50, 50],
  };

  const lineData = weeklyTrends.weeks.map((week, i) => ({
    week,
    total_calls: weeklyTrends.total_calls[i],
    connected_calls: weeklyTrends.connected_calls[i],
    voicemail_calls: weeklyTrends.voicemail_calls[i],
    no_answer_calls: weeklyTrends.no_answer_calls[i],
  }));

  const barData = lineData; // same source for simplicity

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Weekly Trends</h1>
          <p className="text-gray-600">
            Call volume and disposition trends over time
          </p>
        </div>

        {/* Call Volume Trends */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Call Volume Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_calls"
                    stroke="#4BC0C0"
                    fill="#4BC0C0"
                    name="Total Calls"
                  />
                  <Line
                    type="monotone"
                    dataKey="connected_calls"
                    stroke="#36A2EB"
                    fill="#36A2EB"
                    name="Connected"
                  />
                  <Line
                    type="monotone"
                    dataKey="voicemail_calls"
                    stroke="#FFCD56"
                    fill="#FFCD56"
                    name="Voicemail"
                  />
                  <Line
                    type="monotone"
                    dataKey="no_answer_calls"
                    stroke="#FF6384"
                    fill="#FF6384"
                    name="No Answer"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Disposition Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Disposition Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="connected_calls"
                    stackId="a"
                    fill="#36A2EB"
                    name="Connected"
                  />
                  <Bar
                    dataKey="voicemail_calls"
                    stackId="a"
                    fill="#FFCD56"
                    name="Voicemail"
                  />
                  <Bar
                    dataKey="no_answer_calls"
                    stackId="a"
                    fill="#FF6384"
                    name="No Answer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Footer />

      </div>
      
    </main>
  );
}
