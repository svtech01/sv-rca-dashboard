"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";

interface FileStatus {
  name: string;
  status: string;
  className: string;
  updatedAt: string | null;
  sizeKB: string | null;
}

const FileStatuses = forwardRef(({}, ref) => {

  const [csvFiles, setCsvFiles] = useState<FileStatus[]>([]);
  const [loadingCsvFiles, setLoadingCsvFiles] = useState(true);

  const fetchFiles = async () => {
    setLoadingCsvFiles(true);
    const res = await fetch("/api/files");
    const data = await res.json();
    setCsvFiles(data.files || []);
    setLoadingCsvFiles(false);
  };

  useEffect(() => {
    fetchFiles()
  }, [])

  // ✅ Expose refresh() method to parent via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchFiles,
  }));

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Data Files Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-700">
        {loadingCsvFiles ? (
          <>
            <p>Kixie Call History - <span className="text-green-600 font-semibold"><Spinner /></span></p>
            <p>Telesign (With Live) - <span className="text-green-600 font-semibold"><Spinner /></span></p>
            <p>Telesign (Without Live) - <span className="text-green-600 font-semibold"><Spinner /></span></p>
            <p>Powerlist Contacts - <span className="text-green-600 font-semibold"><Spinner /></span></p>
          </>
        ) : (
          csvFiles.map((file, index) => (
            <p key={index} className="mb-5 text-md">{file.name} - <span className={`float-right text-xs badge badge-sm text-sm text-white rounded p-1 ${file.className}`}>
              {file.status}
            </span>
            </p>
          ))
        )}
      </CardContent>
    </Card>
  );
});

FileStatuses.displayName = "FileStatuses";
export default FileStatuses;