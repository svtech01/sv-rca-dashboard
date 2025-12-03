import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import UploadForm from "./upload";
import ListType from "./listtype";

type PowerlistType = {
  id: number;
  name: string;
};

export default function PowerlistSettings({
  onUploadSuccess,
}: {
  onUploadSuccess?: (data: object) => void;
}) {

  const [types, setTypes] = useState<PowerlistType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/powerlist/types");
      if (!res.ok) throw new Error("Failed to fetch types");
      const data = await res.json();
      setTypes(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Powerlist Contacts Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="w-full">
          <UploadForm onUploadSuccess={onUploadSuccess} types={types} />
        </div>
        <div className="w-full">
          <ListType initialTypes={types} onChange={fetchTypes} />
        </div>
      </CardContent>
    </Card>
  );
}