"use client";

import { useState, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toastProvider } from "@/components/ToastService";

type PowerlistType = {
  id: number;
  name: string;
};

export default function ListType({
  onChange,
  initialTypes,
}: {
  onChange?: (event: string) => void;
  initialTypes: PowerlistType[]
}) {

  const [types, setTypes] = useState<PowerlistType[]>(initialTypes ? initialTypes : []);
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    setTypes(initialTypes);
  }, [initialTypes]);

  // ----------------------
  // Add new type
  // ----------------------
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/powerlist/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newType.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add type");
      const data = await res.json();
      setTypes(prev => [...prev, data]);
      setNewType("");
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
    if(onChange) onChange("add");
    setLoading(false);
    toastProvider.success("Added new powerlist!");
  };

  // ----------------------
  // Delete type
  // ----------------------
  const handleDelete = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this type?");
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/powerlist/types/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete type");
      setTypes(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
    if(onChange) onChange("delete")
    setLoading(false);
    toastProvider.success("Removed from powerlist!");
  };

  // ----------------------
  // Start editing
  // ----------------------
  const startEditing = (id: number, currentValue: string) => {
    setEditingId(id);
    setEditingValue(currentValue);
  };

  // ----------------------
  // Save edit
  // ----------------------
  const saveEdit = async (id: number) => {
    if (!editingValue.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/powerlist/types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingValue.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update type");
      const updated = await res.json();
      setTypes(prev =>
        prev.map(t => (t.id === id ? updated : t))
      );
      setEditingId(null);
      setEditingValue("");
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <CardContent className="flex flex-col gap-4">
      <Label className="mb-3">Powerlist Names</Label>

      <form onSubmit={handleAddType} className="flex gap-2 items-center">
        <Input
          placeholder="Create new powerlist"
          value={newType}
          onChange={e => setNewType(e.target.value)}
        />
        <Button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded" type="submit" disabled={loading}>
          Add
        </Button>
      </form>

      <div className="max-h-64 borderx rounded-md p-2 overflow-y-auto">
        {types.length === 0 ? (
          <p className="text-gray-400">{loading ? "Loading..." : "No types found"}</p>
        ) : (
          <ul className="space-y-2">
            {types.map(type => (
              <li
                key={type.id}
                className="flex justify-between items-center p-2 border rounded-md hover:bg-gray-50 text-sm"
              >
                {editingId === type.id ? (
                  <Input
                    className="flex-1 mr-2"
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveEdit(type.id)}
                  />
                ) : (
                  <span>{type.name}</span>
                )}

                <div className="flex gap-2">
                  {editingId === type.id ? (
                    <Button size="sm" variant="outline" onClick={() => saveEdit(type.id)}>
                      Save
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => startEditing(type.id, type.name)}>
                      Edit
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(type.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      

    </CardContent>
  );
};
