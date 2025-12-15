import Papa from "papaparse";
import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { Spinner } from "@/components/ui/spinner";
import { normalizeCSV } from "@/lib/normalizer";
import { toastProvider } from "@/components/ToastService";
import { uploadFile } from "@/services/FileManagerService";
import { addToPowerlist } from "@/services/client/PowerlistService";

type PowerlistType = {
  id: number;
  name: string;
};

export default function UploadForm({
  onUploadSuccess,
  types,
}: {
  onUploadSuccess?: (data: object) => void;
  types: PowerlistType[]
}) {

  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [list, setList] = useState<PowerlistType[]>(types ? types : []);

  useEffect(() => {
    setList(types);
  }, [types]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    if (!file || !fileType) {
      setMessage("Please select both a file and file type.");
      return;
    }

    const text = await file.text();
    const normalizedCsv = normalizeCSV(text, fileType);

    if (!normalizedCsv.success || !normalizedCsv.data) {
      toastProvider.error("Unable to normalize csv file.")
      return
    }

    const csvText = Papa.unparse(normalizedCsv.data);

    const uploadRes = await uploadFile(csvText, fileType, file);

    if (!uploadRes.status) {
      toastProvider.error("Unable to upload CSV file. Try again later");
      return
    }

    console.log("✅ Uploaded large CSV directly to Supabase!");

    //save to database

    const record = await addToPowerlist(csvText, fileType);
    if (record.error) {
      toastProvider.error("Unable to save data to database: " + record.error);
      return
    }

    toastProvider.success("Powerlist contacts added successfully!");
    setUploading(false);

    if (onUploadSuccess) {
      onUploadSuccess({});
    }
  }

  return (
    <form onSubmit={handleUpload} encType="multipart/form-data" className="">

      <div className="mb-4">
        <Label className="mb-4">PowerList Type</Label>
        <Select onValueChange={(value) => setFileType(value)}>
          <SelectTrigger className="mt-1 w-100" style={{ width: '100%' }}>
            <SelectValue placeholder="Select file type" />
          </SelectTrigger>
          <SelectContent>
            {list.map((item) => <SelectItem key={item?.id} value={item?.name}>{item?.name}</SelectItem>)}            
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <Label className="mb-3">Upload File</Label>
        <Input type="file" accept=".csv" className="mt-1" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      <Button className="bg-green-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-100" style={{ width: '100%' }}>
        {uploading ? <><Spinner /> <span>Uploading...</span></> : <span>Upload File</span>}
      </Button>
    </form>
  );
}