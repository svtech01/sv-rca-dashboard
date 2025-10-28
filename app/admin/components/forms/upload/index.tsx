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

export default function UploadForm({
  onUploadSuccess,
}: {
  onUploadSuccess?: (data: object) => void;
}) {

  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

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
      if(onUploadSuccess) onUploadSuccess(data)
    } else {
      setMessage(`❌ Upload failed: ${data.error}`);
    }
    setUploading(false)
  }

  return (
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
  );
}