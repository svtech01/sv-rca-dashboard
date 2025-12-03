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
import { toastProvider } from "@/components/ToastService";

interface FileStatus {
  name: string;
  status: string;
  className: string;
  updatedAt: string | null;
  sizeKB: string | null;
}

export default function SettingsForm() {

  const [loading, setLoading] = useState(false);

  const [dialAtTime, setDialAtTime] = useState<number>(4);
  const [maxAttempts, setMaxAttempts] = useState<number>(10);
  const [attemptsPerDay, setAttemptsPerDay] = useState<number>(2);
  const [cooldownDays, setCooldownDays] = useState<number>(14);
  const [pilotListName, setPilotListName] = useState<string>("NAICS");
  const [timeZone, setTimeZone] = useState<string>("America/New York");
  const [targetConnect, setTargetConnect] = useState<number>(30);
  const [successConnect, setSuccessConnect] = useState<number>(25);
  const [successVoicemail, setSuccessVoicemail] = useState<number>(15);

  const fetchSettings = async () => {

    const res = await fetch("/api/settings");
    if (!res.ok) throw new Error("Failed to fetch types");
    const data = await res.json();

    if(data?.id){

      setDialAtTime(data.dial_at_a_time);
      setMaxAttempts(data?.max_attempts);
      setAttemptsPerDay(data?.attempts_per_day);
      setCooldownDays(data?.cooldown_days);
      setPilotListName(data?.pilot_list_name);
      setTimeZone(data?.timezone);
      setTargetConnect(data?.target_connect);
      setSuccessConnect(data?.success_connect);
      setSuccessVoicemail(data?.success_voicemail);

    }
  }

  const handleUpdate = async () => {

    try {

      setLoading(true)

      const payload = {
        dial_at_a_time: dialAtTime,
        max_attempts: maxAttempts,
        attempts_per_day: attemptsPerDay,
        cooldown_days: cooldownDays,
        pilot_list_name: pilotListName,
        target_connect: targetConnect,
        success_connect: successConnect,
        success_voicemail: successVoicemail
      }

      const req = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res = await req.json();
      if(res){
        toastProvider.success("Configuration settings updated successfully")
      }
      setLoading(false)

    } catch (error) {
      setLoading(false)
      console.log(error)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <Card className="lg:col-span-9">
      <CardHeader>
        <CardTitle>Configuration Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* Dial at a Time */}
          <div>
            <Label className="text-gray-700">Dial at a Time</Label>
            <Input
              type="number"
              placeholder="4"
              className="mt-1"
              value={dialAtTime ?? ""}
              onChange={(e) => setDialAtTime(Number(e.currentTarget.value))}
            />
            <p className="text-xs text-gray-500 italic mt-1">
              * Number of simultaneous dials (1-2 for pilot)
            </p>
          </div>

          {/* Max Attempts */}
          <div>
            <Label className="text-gray-700">Max Attempts</Label>
            <Input
              type="number"
              placeholder="4"
              className="mt-1"
              value={maxAttempts ?? ""}
              onChange={(e) => setMaxAttempts(Number(e.currentTarget.value))}
            />
            <p className="text-xs text-gray-500 italic mt-1">
              * Maximum attempts per contact
            </p>
          </div>

          {/* Attempts per Day */}
          <div>
            <Label className="text-gray-700">Attempts per Day</Label>
            <Input
              type="number"
              className="mt-1"
              value={attemptsPerDay ?? ""}
              onChange={(e) => setAttemptsPerDay(Number(e.currentTarget.value))}
            />
          </div>

          {/* Cooldown Days */}
          <div>
            <Label className="text-gray-700">Cooldown Days</Label>
            <Input
              type="number"
              className="mt-1"
              value={cooldownDays ?? ""}
              onChange={(e) => setCooldownDays(Number(e.currentTarget.value))}
            />
          </div>

          {/* Pilot List Name */}
          <div>
            <Label className="text-gray-700">Pilot List Name</Label>
            <Input
              type="text"
              className="mt-1"
              value={pilotListName ?? ""}
              onChange={(e) => setPilotListName(e.currentTarget.value)}
            />
            <p className="text-xs text-gray-500 italic mt-1">
              * Substring to filter pilot lists
            </p>
          </div>

          {/* Timezone */}
          {/* <div>
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
          </div> */}
        </div>

        <div className="flex gap-x-6 gap-y-5">
          {/* Target Connect Uplift % */}
          <div className="w-1/3">
            <Label className="text-gray-700">Target Connect Uplift %</Label>
            <Input
              type="number"
              className="mt-1"
              value={targetConnect ?? ""}
              onChange={(e) => setTargetConnect(Number(e.currentTarget.value))}
            />
          </div>

          {/* Success Connect Uplift % */}
          <div className="w-1/3">
            <Label className="text-gray-700">Success Connect Uplift %</Label>
            <Input
              type="number"
              className="mt-1"
              value={successConnect ?? ""}
              onChange={(e) => setSuccessConnect(Number(e.currentTarget.value))}
            />
          </div>

          {/* Success Voicemail Uplift % */}
          <div className="w-1/3">
            <Label className="text-gray-700">Success Voicemail Uplift %</Label>
            <Input
              type="number"
              className="mt-1"
              value={successVoicemail ?? ""}
              onChange={(e) => setSuccessVoicemail(Number(e.currentTarget.value))}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleUpdate} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">            
            {loading ? <><Spinner /> <span>Updating ...</span></> : <span>Update Settings</span>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}