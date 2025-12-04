"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";

interface File {
  name: string;
  url: string;
  updated_at: string;
}

interface FileStatus {
  id: number;
  name: string;
  status: string;
  className: string;
  updatedAt: string | null;
  fileCount: number;
  sizeKB: string | null;
  files: File[] | null;
}

const FileStatuses = forwardRef(({ }, ref) => {

  const [powerlist, setPowerlist] = useState<FileStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    setLoading(true);
    const res = await fetch("/api/files");
    const data = await res.json();

    console.log("data", data);

    setPowerlist(data.types || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles()
  }, [])

  // ✅ Expose refresh() method to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchFiles,
  }));

  return (
    <Card className="lg:col-span-3 mt-8">
      <CardHeader>
        <CardTitle>Powerlist File History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-gray-700">

        {loading ? (
          <div className="flex items-center gap-2">
            <span>Powerlist Contacts</span>
            <Spinner className="text-green-600" />
          </div>
        ) : (
          powerlist.map((item) => {

            const fileCount = item.files?.length ?? 0;
            const status = item.status ?? "active";

            return (
              <div
                key={item.id}
                className="border-b pb-3"
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium text-base">{item.name}</p>

                  {/* Status Badge */}
                  <span
                    className={`
                      text-xs px-2 py-1 rounded-full text-white
                      ${status === "active" || status === null ? "bg-green-600" : "bg-gray-500"}
                    `}
                  >
                    {status ?? "active"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1 mb-3">
                  {fileCount} {fileCount === 1 ? "file" : "files"} loaded
                </p>
                                
                {item.files?.map((fileItem, i) => {
                  return (
                    <div key={i} className="mb-3">
                      <p>* {fileItem.name}</p>
                      <span><small>uploaded on {fileItem.updated_at}</small></span>
                    </div>
                  )
                })}


              </div>
            );
          })
        )}

      </CardContent>

    </Card>
  );
});

FileStatuses.displayName = "FileStatuses";
export default FileStatuses;