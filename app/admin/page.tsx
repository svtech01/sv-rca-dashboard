"use client";

import Header from "@/components/Header";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface FileStatus {
  name: string;
  status: string;
  className: string;
  updatedAt: string | null;
  sizeKB: string | null;
}

export default function AdminPage() {

  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("");
  const [message, setMessage] = useState("");

  const [csvFiles, setCsvFiles] = useState<FileStatus[]>([]);

  const [uploading, setUploading] = useState(false);
  const [loadingCsvFiles, setLoadingCsvFiles] = useState(true);

  const fetchFiles = async () => {
    setLoadingCsvFiles(true);
    const res = await fetch("/api/files");
    const data = await res.json();
    setCsvFiles(data.files || []);
    setLoadingCsvFiles(false);
  };

  useEffect(() => {    
    fetchFiles();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !fileType) {
      setMessage("Please select both a file and file type.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", fileType);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log(data)
    if (res.ok) {
      toast.success(data.message, {
        style: {
          backgroundColor: '#d4edda',
          color: '#155724',
          borderColor: '#c3e6cb'        
        }
      })      
      fetchFiles()
    } else {
      setMessage(`❌ Upload failed: ${data.error}`);
    }
    setUploading(false)
  }

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
        <Card className="lg:col-span-9">
          <CardHeader>
            <CardTitle>Configuration Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Dial at a Time */}
              <div>
                <Label className="text-gray-700">Dial at a Time</Label>
                <Input type="number" placeholder="4" className="mt-1" />
                <p className="text-xs text-gray-500 italic mt-1">
                  * Number of simultaneous dials (1-2 for pilot)
                </p>
              </div>

              {/* Max Attempts */}
              <div>
                <Label className="text-gray-700">Max Attempts</Label>
                <Input type="number" placeholder="10" className="mt-1" />
                <p className="text-xs text-gray-500 italic mt-1">
                  * Maximum attempts per contact
                </p>
              </div>

              {/* Attempts per Day */}
              <div>
                <Label className="text-gray-700">Attempts per Day</Label>
                <Input type="number" placeholder="2" className="mt-1" />
              </div>

              {/* Cooldown Days */}
              <div>
                <Label className="text-gray-700">Cooldown Days</Label>
                <Input type="number" placeholder="14" className="mt-1" />
              </div>

              {/* Pilot List Name */}
              <div>
                <Label className="text-gray-700">Pilot List Name</Label>
                <Input type="text" placeholder="NAICS" className="mt-1" />
                <p className="text-xs text-gray-500 italic mt-1">
                  * Substring to filter pilot lists
                </p>
              </div>

              {/* Timezone */}
              <div>
                <Label className="text-gray-700">Timezone</Label>
                <Select>
                  <SelectTrigger className="mt-1 w-90">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Manila">Asia/Manila</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">
                      America/New York
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>              
            </div>
            
            <div className="flex gap-x-6 gap-y-5">
              {/* Target Connect Uplift % */}
              <div className="w-1/3">
                <Label className="text-gray-700">Target Connect Uplift %</Label>
                <Input type="number" placeholder="30" className="mt-1" />
              </div>

              {/* Success Connect Uplift % */}
              <div className="w-1/3">
                <Label className="text-gray-700">Success Connect Uplift %</Label>
                <Input type="number" placeholder="25" className="mt-1" />
              </div>

              {/* Success Voicemail Uplift % */}
              <div className="w-1/3">
                <Label className="text-gray-700">Success Voicemail Uplift %</Label>
                <Input type="number" placeholder="15" className="mt-1" />
              </div>
            </div>

            <div className="pt-4">
              <Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Update Settings</Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Files Status */}
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
      </div>

      {/* Upload Data Files */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Upload Data Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <form onSubmit={handleUpload} encType="multipart/form-data" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Select File</Label>
              <Input type="file" accept=".csv" className="mt-1" onChange={(e) => setFile(e.target.files?.[0] || null)} />              
            </div>

            <div>
              <Label>File Type</Label>
              <Select onValueChange={(value) => setFileType(value)}>
                <SelectTrigger className="mt-1 w-100">
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kixie Call History">Kixie Call History</SelectItem>
                  <SelectItem value="Telesign (With Live)">Telesign (With Live)</SelectItem>
                  <SelectItem value="Telesign (Without Live)">Telesign (Without Live)</SelectItem>
                  <SelectItem value="Powerlist Contacts">Powerlist Contacts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-green-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              {uploading ? <><Spinner /> <span>Uploading...</span></> : <span>Upload File</span>}
            </Button>
          </form>

        </CardContent>
      </Card>

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
