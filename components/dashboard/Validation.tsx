"use-client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface DataHygeineMetricsProps {
  filter: string;
}

const RenderSkeleton = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-700 mb-5">Data Hygiene</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" style={{height: 150}}>
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Total Validated</CardTitle></CardHeader>
          <CardContent><center><Spinner className="text-blue-700 size-7" /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Reachable</CardTitle></CardHeader>
          <CardContent><center><Spinner className="text-green-500 size-7" /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Without Phone ID Live</CardTitle></CardHeader>
          <CardContent><center><Spinner className="text-red-500 size-7" /></center></CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Validated & Dialed</CardTitle></CardHeader>
          <CardContent><center><Spinner className="text-blue-500 size-7" /></center></CardContent>
        </Card>
      </div>
    </section>
  )
}

export const DataHygeineMetrics = () => {

  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<any>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/dashboard/validation`);
      const result = await res.json();

      setValidation(result);
      setLoading(false);

    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  useEffect(() => {
    fetchMetrics();
  }, [])

  if(loading) return <RenderSkeleton />

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-700 mb-5">Data Hygiene</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Total Validated</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {validation.total_validated ?? 0}
            </div>
            <p className="text-sm text-gray-500">Phone numbers</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Reachable</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {validation.reachable_count ?? 0}
            </div>
            <p className="text-sm text-gray-500">
              {validation.reachable_rate?.toFixed(1) ?? 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Without Phone ID Live</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {validation.invalid_count ?? 0}
            </div>
            <p className="text-sm text-gray-500">{validation.invalid_pct ?? 0}% of total</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Validated & Dialed</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {validation.validated_dialed_count ?? 0}
            </div>
            <p className="text-sm text-gray-500">{validation.validated_dialed_pct ?? 0}% of validated</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}