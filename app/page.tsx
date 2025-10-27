"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { useEffect, useState } from "react";

const sections = [
    {
      title: "Baseline Metrics",
      metrics: [
        { label: "Connect Rate", value: "0%", sub: "0 / 0 calls", color: "text-blue-600" },
        { label: "Answer Event %", value: "0%", sub: "Approximated visibility", color: "text-blue-400" },
        { label: "Avg Attempts Lost-Race", value: "0", sub: "Per contact", color: "text-yellow-500" },
        { label: "Cooldown / Day", value: "0", sub: "Contacts hitting max attempts", color: "text-red-600" },
      ],
    },
    {
      title: "Pilot Metrics (NAICS Powerlist)",
      metrics: [
        { label: "Sample Size", value: "0", sub: "Unique contacts", color: "text-green-600" },
        { label: "Target Connect Rate", value: "0%", sub: "+0% vs baseline", color: "text-blue-600" },
        { label: "Success Criteria", value: "0%", sub: "Min connect rate uplift", color: "text-blue-400" },
        { label: "Test Duration", value: "0", sub: "Business days", color: "text-yellow-500" },
      ],
    },
    {
      title: "Data Hygiene",
      metrics: [
        { label: "Total Validated", value: "0", sub: "Phone numbers", color: "text-blue-600" },
        { label: "Reachable", value: "0", sub: "0.0% of total", color: "text-green-600" },
        { label: "Invalid", value: "0", sub: "0% of total", color: "text-red-600" },
        { label: "Validated & Dialed", value: "0", sub: "0% of validated", color: "text-blue-400" },
      ],
    },
    {
      title: "Reattempt / Cooldown",
      metrics: [
        { label: "Cooldown Contacts", value: "0", sub: "At max attempts", color: "text-yellow-500" },
        { label: "Reattempt Potential", value: "0", sub: "Expected successful recontacts", color: "text-green-600" },
        { label: "Target KPI", value: "0%", sub: "Success rate target", color: "text-blue-600" },
      ],
    },
  ];

export default function DashboardPage() {

  const [data, setData] = useState<any>(null);

  const fetchMetrics = async () => {
    const res = await fetch("/api/dashboard");
    const records = await res.json();
    setData(records)
    console.log(records)
  }

  useEffect(() => {
    fetchMetrics()
  }, []);

  if (!data) return <p>Loading metrics...</p>;

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Kixie Powerlist RCA Dashboard
        </h1>

        <p className="text-gray-500 mb-2 text-sm float-right">
          Data source: {data.source} | Last updated:{" "}
          {new Date(data.last_updated).toLocaleString()}
        </p>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {section.metrics.map((m) => (
                  <Card key={m.label} className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base text-gray-600 text-lg">
                        {m.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
                      <p className="text-sm text-gray-500">{m.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
        <br /><br />
        <div className="card-body mt-5 bg-blue-500 text-white px-4 py-3" role="alert">
          <h4>📋 Phone ID Live Status Logging Plan</h4>
          <p>Remember to log "Phone ID Live Status" as a HubSpot property for all contacts. This will help track validation effectiveness and improve future targeting.</p>
        </div>
        <Footer />
      </div>
    </main>
  );
}
