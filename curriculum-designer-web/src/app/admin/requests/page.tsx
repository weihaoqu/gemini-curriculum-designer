"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiUrl } from "@/lib/utils";

interface ImplementationRequest {
  id: number;
  email: string;
  course_topic: string;
  course_info: string;
  files: string;
  created_at: string;
  status: string;
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseFiles(raw: string): { name: string; content: string }[] {
  const parts = raw.split(/^--- (.+?) ---$/gm);
  const files: { name: string; content: string }[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i].trim();
    const content = (parts[i + 1] ?? "").trim();
    if (name) files.push({ name, content });
  }
  return files;
}

// --- Password gate ---

function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Wrong password");
        return;
      }

      onAuthenticated();
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-24 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-pw" className="text-sm font-medium">
                Password
              </label>
              <input
                id="admin-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || !password} className="w-full">
              {loading ? "Checking..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main page ---

export default function AdminRequestsPage() {
  const [authed, setAuthed] = useState(false);
  const [requests, setRequests] = useState<ImplementationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(apiUrl("/api/admin/requests"))
      .then((r) => {
        if (r.status === 401) {
          setAuthed(false);
          throw new Error("Unauthorized");
        }
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setRequests(data.requests ?? []);
        setAuthed(true);
      })
      .catch((err) => {
        if (err.message !== "Unauthorized") setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Try fetching on mount — if cookie is still valid, skip the password gate
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (!authed && !loading) {
    return <PasswordGate onAuthenticated={fetchRequests} />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <p className="text-muted-foreground text-center">Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <p className="text-destructive text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex gap-1 mb-6 border-b">
        <Link
          href="/admin/requests"
          className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary"
        >
          Requests
        </Link>
        <Link
          href="/admin/feedback"
          className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
        >
          Feedback
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Implementation Requests</h1>
      <p className="text-muted-foreground mb-8">
        {requests.length} request{requests.length !== 1 ? "s" : ""} submitted.
        Click a request to view and download the curriculum files.
      </p>

      {requests.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No requests yet.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id;
            const files = isExpanded ? parseFiles(req.files) : [];
            let courseInfo: Record<string, string> = {};
            try {
              courseInfo = JSON.parse(req.course_info);
            } catch {
              // ignore
            }

            return (
              <Card key={req.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        #{req.id} — {req.course_topic || "Untitled"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {req.email} · {new Date(req.created_at + "Z").toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={req.status === "pending" ? "secondary" : "default"}
                    >
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {Object.keys(courseInfo).length > 0 && (
                      <div className="rounded-lg bg-muted/30 p-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Course Info
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          {Object.entries(courseInfo).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-muted-foreground capitalize text-xs">
                                {key.replace(/([A-Z])/g, " $1")}
                              </p>
                              <p className="font-medium text-sm">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Curriculum Files ({files.length})
                      </h4>
                      {files.length > 0 ? (
                        <div className="space-y-2">
                          {files.map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.content.length / 1024).toFixed(1)} KB ·{" "}
                                  {file.content.split("\n").length} lines
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadTextFile(file.content, file.name)}
                              >
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Could not parse individual files.
                        </p>
                      )}

                      <Button
                        className="mt-3"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadTextFile(
                            req.files,
                            `request-${req.id}-all-files.md`
                          )
                        }
                      >
                        Download All (raw bundle)
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
