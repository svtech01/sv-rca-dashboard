"use client";

import Header from "@/components/Header";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

import { useState, useRef, useEffect } from "react";
import SettingsForm from "./components/forms/settings";
import UploadForm from "./components/forms/upload";
import FileStatuses from "./components/status";

export default function AdminPage() {

  const [loading, setLoading] = useState(false);
  const fileStatusesRef = useRef<{ refresh: () => void }>(null);

  const handleUploadSuccess = () => {
    // ✅ Automatically refresh file list after successful upload
    fileStatusesRef.current?.refresh();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        
        <h1 className="text-3xl font-bold mb-8">Admin Settings</h1>
        <p className="text-gray-600 mb-10">
          Configure dashboard settings and manage data files
        </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Settings */}
        <SettingsForm />

        {/* Data Files Status */}
        <FileStatuses ref={fileStatusesRef} />
      </div>

      {/* Upload Data Files */}
      <UploadForm onUploadSuccess={handleUploadSuccess} />

      {/* Export Options */}
        <Card className="mt-8 mb-5">
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex gap-6">
            <Button variant="outline" color="bg-blue-600" className="w-50 text-blue-600">Export Summary PDF</Button>
            <Button variant="outline" className="w-50 text-gray-600">
              Export Current View to CSV
            </Button>
          </CardContent>
        </Card>

      <Footer />

      </div>
    </main>
  );
}
