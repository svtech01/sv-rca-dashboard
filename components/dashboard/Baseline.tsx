"use-client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface BaselineProps {
  filter: string;
}

const RenderSkeleton = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-700 mb-5">Baseline Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Connect Rate</CardTitle></CardHeader>
          <CardContent><center><Spinner /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Answer Event %</CardTitle></CardHeader>
          <CardContent><center><Spinner /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Avg Attempts Lost-Race</CardTitle></CardHeader>
          <CardContent><center><Spinner /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Cooldown / Day</CardTitle></CardHeader>
          <CardContent><center><Spinner /></center></CardContent>
        </Card>
      </div>
    </section>
  )
}

export const BaselineMetrics = ({ filter }: BaselineProps) => {

  const [loading, setLoading] = useState(false);
  const [baseline, setBaseline] = useState<any>(null);
  const [timespan, setTimespan] = useState<any>(null);

  const fetchMetrics = async (filterBy: string) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/dashboard/baseline?filter=${filterBy}`);
      const result = await res.json();

      setTimespan(result?.timespan);
      setBaseline(result?.baseline);
      

    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  useEffect(() => {
    fetchMetrics(filter);
  }, [filter])

  if (!baseline) return <RenderSkeleton />

  return (
    <div>
      
      <section className="mb-10">
        <div className="mb-8 align-items-end">
        <span className="text-gray-500 mb-2 text-sm">
          Data source: &nbsp;
          <b>{timespan?.earliest ? timespan?.earliest : ''}</b>
          &nbsp;to&nbsp;
          <b>{timespan?.latest ? timespan?.latest : ''}</b>
        </span>        
      </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-5">Baseline Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Connect Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {baseline.connect_rate?.toFixed(2) ?? 0}%
              </div>
              <p className="text-sm text-gray-500">
                {baseline.connected_calls ?? 0} / {baseline.total_calls ?? 0} calls
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Answer Event %</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {baseline.answer_event_pct?.toFixed(2) ?? 0}%
              </div>
              <p className="text-sm text-gray-500">Approximated visibility</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Avg Attempts Lost-Race</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                {baseline.avg_attempts_lost_race?.toFixed(2) ?? 0}
              </div>
              <p className="text-sm text-gray-500">Per contact</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Cooldown / Day</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {baseline.cooldown_per_day ?? 0}
              </div>
              <p className="text-sm text-gray-500">Contacts hitting max attempts</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}