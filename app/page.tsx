"use client";

import { useEffect, useState } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DateRangeFilter from "@/components/DateFilter";

import { BaselineMetrics } from "@/components/dashboard/Baseline";
import { DataHygeineMetrics } from "@/components/dashboard/Validation";
import { CooldownMetrics } from "@/components/dashboard/Cooldown";
import { PilotMetrics } from "@/components/dashboard/Pilot";

export default function DashboardPage() {

  const [filterBy, setFilterBy] = useState("all");

  const handleOnChangeFilter = async (filter: any) => {
    setFilterBy(filter)
  }

  return (
    <main className="min-h-screenx bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Kixie Powerlist RCA Dashboard
        </h1>

        <div className="float-right">
          <DateRangeFilter value={filterBy} onRangeChange={handleOnChangeFilter} />
        </div>

        <div className="space-y-10 mt-8">
          
          <BaselineMetrics filter={filterBy} />

          <PilotMetrics filter={filterBy} />

          <DataHygeineMetrics />

          <CooldownMetrics filter={filterBy} />

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
