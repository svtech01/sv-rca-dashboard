"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSection from "@/components/LoadingSection";
import DateRangeFilter from "@/components/DateFilter";

export default function DashboardPage() {

  const [data, setData] = useState<any>(null);
  const [filterBy, setFilterBy] = useState("all");

  const fetchMetrics = async (newFilter: string) => {
    try {
      setData(null)
      console.log("Loading..")
      console.log("Filters:", newFilter)
       const res = await fetch(`/api/dashboard?filter=${newFilter}`);
      const records = await res.json();
      setData(records);
      console.log("📊 Dashboard data loaded:", records);
    } catch (err) {
      console.error("❌ Failed to load dashboard:", err);
    }
  };

  const handleOnChangeFilter = async (filter: any) => {
    setFilterBy(filter)
  }

  // useEffect(() => {
  //   fetchMetrics(filterBy);
  // }, []);

  useEffect(() => {
    fetchMetrics(filterBy); // Triggered by filtering, fetch metrics
  }, [filterBy]);

  if (!data) return <LoadingSection />;

  // Extract results from API
  const baseline = data.baseline || {};
  const pilot = data.pilot || {};
  const validation = data.validation || {};
  const cooldown = data.cooldown || {};

  // Build dynamic dashboard sections
  const sections = [
    {
      title: "Baseline Metrics",
      metrics: [
        {
          label: "Connect Rate",
          value: `${baseline.connect_rate?.toFixed(2) ?? 0}%`,
          sub: `${baseline.connected_calls ?? 0} / ${baseline.total_calls ?? 0} calls`,
          color: "text-blue-600",
        },
        {
          label: "Answer Event %",
          value: `${baseline.answer_event_pct?.toFixed(2) ?? 0}%`,
          sub: "Approximated visibility",
          color: "text-blue-400",
        },
        {
          label: "Avg Attempts Lost-Race",
          value: `${baseline.avg_attempts_lost_race?.toFixed(2) ?? 0}`,
          sub: "Per contact",
          color: "text-yellow-500",
        },
        {
          label: "Cooldown / Day",
          value: `${baseline.cooldown_per_day ?? 0}`,
          sub: "Contacts hitting max attempts",
          color: "text-red-600",
        },
      ],
    },
    {
      title: "Powerlist",
      metrics: [
        {
          label: "Sample Size",
          value: `${pilot.sample_size ?? 0}`,
          sub: "Unique contacts",
          color: "text-green-600",
        },
        {
          label: "Target Connect Rate",
          value: `${pilot.target_connect_rate?.toFixed(2) ?? 0}%`,
          sub: `+${pilot.target_connect_uplift_pct ?? 0}% vs baseline`,
          color: "text-blue-600",
        },
        {
          label: "Success Criteria",
          value: `${pilot.success_connect_uplift_pct ?? 0}%`,
          sub: "Min connect rate uplift",
          color: "text-blue-400",
        },
        {
          label: "Test Duration",
          value: `${pilot.test_duration_days ?? 0}`,
          sub: "Business days",
          color: "text-yellow-500",
        },
      ],
      filter: [
        "NAICS",
        "Construction"
      ]
    },
    {
      title: "Data Hygiene",
      metrics: [
        {
          label: "Total Validated",
          value: `${validation.total_validated ?? 0}`,
          sub: "Phone numbers",
          color: "text-blue-600",
        },
        {
          label: "Reachable",
          value: `${validation.reachable_count ?? 0}`,
          sub: `${validation.reachable_rate?.toFixed(1) ?? 0}% of total`,
          color: "text-green-600",
        },
        {
          label: "Without Phone ID Live",
          value: `${validation.invalid_count ?? 0}`,
          sub: `${validation.invalid_pct ?? 0}% of total`,
          color: "text-red-600",
        },
        {
          label: "Validated & Dialed",
          value: `${validation.validated_dialed_count ?? 0}`,
          sub: `${validation.validated_dialed_pct ?? 0}% of validated`,
          color: "text-blue-400",
        },
      ],
    },
    {
      title: "Reattempt / Cooldown",
      metrics: [
        {
          label: "Cooldown Contacts",
          value: `${cooldown.cooldown_contacts_count ?? 0}`,
          sub: "At max attempts",
          color: "text-yellow-500",
        },
        {
          label: "Reattempt Potential",
          value: `${cooldown.reattempt_potential ?? 0}`,
          sub: "Expected successful recontacts",
          color: "text-green-600",
        },
        {
          label: "Target KPI",
          value: `${cooldown.target_kpi ?? 0}%`,
          sub: "Success rate target",
          color: "text-blue-600",
        },
      ],
    },
  ];

  return (
    <main className="min-h-screenx bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Kixie Powerlist RCA Dashboard
        </h1>

        <div className="mb-8 align-items-end">
          <span className="text-gray-500 mb-2 text-sm">
              Data source: {data.cached ? "Supabase Cache" : "Recomputed"} | Last updated:{" "}
              {new Date(data.last_updated).toLocaleString()}          
            </span>
          <div className="float-right">
            <DateRangeFilter value={filterBy} onRangeChange={handleOnChangeFilter} />            
          </div>
        </div>

        <div className="space-y-10 mt-8">
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
                      <div className={`text-3xl font-bold ${m.color}`}>
                        {m.value}
                      </div>
                      <p className="text-sm text-gray-500">{m.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        <br />
        <div
          className="card-body mt-5 bg-blue-500 text-white px-4 py-3 rounded-md"
          role="alert"
        >
          <h4 className="font-semibold">📋 Phone ID Live Status Logging Plan</h4>
          <p>
            Remember to log "Phone ID Live Status" as a HubSpot property for all
            contacts. This will help track validation effectiveness and improve
            future targeting.
          </p>
        </div>

        <Footer />
      </div>
    </main>
  );
}
