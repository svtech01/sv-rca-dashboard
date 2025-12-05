"use-client";

import { Key, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

interface PilotProps {
  filter: string
}

const RenderSkeleton = () => {
  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-gray-700">Powerlist</h2>        
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" style={{height: 150}}>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Sample Size</CardTitle></CardHeader>
          <CardContent><center><Spinner className="text-yellow-500 size-7" /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Target Connect Rate</CardTitle></CardHeader>          
          <CardContent><center><Spinner className="text-blue-600 size-7" /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Success Criteria</CardTitle></CardHeader>
          <CardContent><center><Spinner className="text-blue-400 size-7" /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Test Duration</CardTitle></CardHeader>
          <CardContent><center><Spinner className="text-yellow-500 size-7" /></center></CardContent>
        </Card>
      </div>
    </section>
  )
}

export const PilotMetrics = ({ filter }: PilotProps) => {

  const [loading, setLoading] = useState(true);
  const [pilot, setPilot] = useState<any>(null);
  const [powerlistConfig, setPowerlistConfig] = useState<any>(null);
  const [selectedList, setSelectedList] = useState<string>('All');

  const fetchMetrics = async (filterByTime: string, filterByList: string) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/dashboard/pilot?filterByTime=${filterByTime}&filterByList=${filterByList}`);
      const result = await res.json();

      setPilot(result?.pilot);
      setPowerlistConfig(result?.powerlistConfig);
      setLoading(false);

    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  const handleListChange = (value: string) => {
    setSelectedList(value)
    fetchMetrics(filter, value)
  }

  useEffect(() => {
    fetchMetrics(filter, selectedList);
  }, [filter])

  if (loading) return <RenderSkeleton />

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-gray-700">Powerlist</h2>
        {powerlistConfig?.list && (
          <Select onValueChange={handleListChange}>
            <SelectTrigger className="mt-1 w-60">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {powerlistConfig.list.map((item: { name: any; }, idx: Key | null | undefined) => (
                <SelectItem key={idx} value={item.name ?? ""}>
                  {item.name ?? ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Sample Size</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {pilot.sample_size ?? 0}
            </div>
            <p className="text-sm text-gray-500">Unique contacts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Target Connect Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {pilot.target_connect_rate?.toFixed(2) ?? 0}%
            </div>
            <p className="text-sm text-gray-500">
              +{pilot.target_connect_uplift_pct ?? 0}% vs baseline
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Success Criteria</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {pilot.success_connect_uplift_pct ?? 0}%
            </div>
            <p className="text-sm text-gray-500">Min connect rate uplift</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Test Duration</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {pilot.test_duration_days ?? 0}
            </div>
            <p className="text-sm text-gray-500">Business days</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}