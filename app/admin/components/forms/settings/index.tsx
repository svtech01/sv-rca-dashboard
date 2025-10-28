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

export default function SettingsForm() {

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
  );
}