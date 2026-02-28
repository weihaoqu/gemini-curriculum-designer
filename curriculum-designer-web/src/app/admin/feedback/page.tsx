"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeedbackRow {
  id: number;
  email: string;
  category: string;
  message: string;
  mode: string;
  phase: string;
  page_path: string;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  bug: "bg-red-100 text-red-700 border-red-200",
  feature: "bg-blue-100 text-blue-700 border-blue-200",
  general: "bg-gray-100 text-gray-700 border-gray-200",
};

const categoryLabels: Record<string, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  general: "General",
};

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
      const res = await fetch("/api/admin/login", {
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

// --- Admin Nav ---

function AdminNav({ active }: { active: "requests" | "feedback" }) {
  return (
    <div className="flex gap-1 mb-6 border-b">
      <Link
        href="/admin/requests"
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          active === "requests"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        Requests
      </Link>
      <Link
        href="/admin/feedback"
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          active === "feedback"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        Feedback
      </Link>
    </div>
  );
}

// --- Main page ---

export default function AdminFeedbackPage() {
  const [authed, setAuthed] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchFeedback = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/feedback")
      .then((r) => {
        if (r.status === 401) {
          setAuthed(false);
          throw new Error("Unauthorized");
        }
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setFeedback(data.feedback ?? []);
        setAuthed(true);
      })
      .catch((err) => {
        if (err.message !== "Unauthorized") setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (!authed && !loading) {
    return <PasswordGate onAuthenticated={fetchFeedback} />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <p className="text-muted-foreground text-center">Loading feedback...</p>
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
      <AdminNav active="feedback" />

      <h1 className="text-2xl font-bold mb-2">User Feedback</h1>
      <p className="text-muted-foreground mb-8">
        {feedback.length} feedback item{feedback.length !== 1 ? "s" : ""} received.
        Click to expand details.
      </p>

      {feedback.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No feedback yet.
        </p>
      ) : (
        <div className="space-y-3">
          {feedback.map((fb) => {
            const isExpanded = expandedId === fb.id;

            return (
              <Card key={fb.id}>
                <CardHeader
                  className="cursor-pointer py-4"
                  onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            categoryColors[fb.category] ?? categoryColors.general
                          }`}
                        >
                          {categoryLabels[fb.category] ?? fb.category}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {fb.mode}
                        </Badge>
                      </div>
                      <p className="text-sm truncate">{fb.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {fb.phase} · {new Date(fb.created_at + "Z").toLocaleString()}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0">
                      #{fb.id}
                    </span>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="rounded-lg bg-muted/30 p-4">
                      <p className="text-sm whitespace-pre-wrap">{fb.message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {fb.email || <span className="text-muted-foreground italic">Not provided</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Page Path</p>
                        <p className="font-medium font-mono text-xs">{fb.page_path}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Mode</p>
                        <p className="font-medium">{fb.mode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phase</p>
                        <p className="font-medium">{fb.phase}</p>
                      </div>
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
