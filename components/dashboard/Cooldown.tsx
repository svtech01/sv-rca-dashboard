"use-client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface CooldownMetricsProps {
  filter: string;
}

const RenderSkeleton = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-700 mb-5">Reattempt / Cooldown</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Cooldown Contacts</CardTitle></CardHeader>
          <CardContent><center><Spinner /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Reattempt Potential</CardTitle></CardHeader>
          <CardContent><center><Spinner /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Target KPI</CardTitle></CardHeader>
          <CardContent><center><Spinner /></center></CardContent>
        </Card>
      </div>
    </section>
  )
}

export const CooldownMetrics = ({filter}: CooldownMetricsProps) => {

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState<any>(null);

  const fetchMetrics = async (filterBy: string) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/dashboard/cooldown?filter=${filterBy}`);
      const result = await res.json();

      setCooldown(result);

    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  useEffect(() => {
    fetchMetrics(filter);
  }, [filter])

  if(!cooldown) return <RenderSkeleton />

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-700 mb-5">Reattempt / Cooldown</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Cooldown Contacts</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {cooldown.cooldown_contacts_count ?? 0}
            </div>
            <p className="text-sm text-gray-500">At max attempts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Reattempt Potential</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {cooldown.reattempt_potential ?? 0}
            </div>
            <p className="text-sm text-gray-500">Expected successful recontacts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Target KPI</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {cooldown.target_kpi ?? 0}%
            </div>
            <p className="text-sm text-gray-500">Success rate target</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}