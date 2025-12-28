"use client";

import { useState, useRef } from "react";
import {
    Upload,
    FileJson,
    Loader2,
    Check,
    X,
    AlertTriangle,
    Download,
    Eye
} from "lucide-react";

interface ValidationResult {
    index: number;
    title: string;
    valid: boolean;
    errors: string[];
}

interface ImportResult {
    success: boolean;
    preview?: boolean;
    validCount?: number;
    invalidCount?: number;
    importedCount?: number;
    failedCount?: number;
    results?: ValidationResult[];
    message?: string;
}

export default function AdminImportPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [jsonInput, setJsonInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        setJsonInput(text);
        setResult(null);
    };

    const parseJSON = () => {
        try {
            const data = JSON.parse(jsonInput);
            return Array.isArray(data) ? data : [data];
        } catch {
            return null;
        }
    };

    const handlePreview = async () => {
        const challenges = parseJSON();
        if (!challenges) {
            setResult({ success: false, message: "Invalid JSON format" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/challenges/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ challenges, preview: true })
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error("Preview error:", error);
            setResult({ success: false, message: "Failed to preview" });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        const challenges = parseJSON();
        if (!challenges) {
            setResult({ success: false, message: "Invalid JSON format" });
            return;
        }

        if (!confirm(`Import ${result?.validCount || challenges.length} challenges?`)) return;

        setLoading(true);
        try {
            const res = await fetch("/api/admin/challenges/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ challenges, preview: false })
            });
            const data = await res.json();
            setResult(data);
            if (data.success) {
                setJsonInput("");
            }
        } catch (error) {
            console.error("Import error:", error);
            setResult({ success: false, message: "Failed to import" });
        } finally {
            setLoading(false);
        }
    };

    const sampleJSON = `[
  {
    "title": "Example Challenge",
    "slug": "example-challenge",
    "description": "Challenge description here",
    "categoryName": "Web",
    "difficulty": "MEDIUM",
    "points": 100,
    "flag": "UG0x1{example_flag_here_12345}",
    "resourceUrl": "https://example.com/files.zip"
  }
]`;

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "40px" }}>
                <h1 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                }}>
                    <Upload size={32} style={{ color: "var(--yellow)" }} />
                    Bulk Import
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    Import multiple challenges at once using JSON format.
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Input Section */}
                <div className="card">
                    <h3 style={{
                        fontFamily: "var(--font-heading)",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <FileJson size={20} style={{ color: "var(--yellow)" }} />
                        Challenge Data
                    </h3>

                    {/* File Upload */}
                    <div style={{ marginBottom: "16px" }}>
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                padding: "12px 20px",
                                background: "var(--black-lighter)",
                                border: "1px solid var(--black-border)",
                                borderRadius: "8px",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            <Upload size={18} />
                            Upload JSON File
                        </button>
                    </div>

                    {/* JSON Textarea */}
                    <textarea
                        value={jsonInput}
                        onChange={(e) => { setJsonInput(e.target.value); setResult(null); }}
                        placeholder="Paste JSON array of challenges here..."
                        style={{
                            width: "100%",
                            minHeight: "300px",
                            padding: "16px",
                            background: "var(--black-lighter)",
                            border: "1px solid var(--black-border)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontFamily: "monospace",
                            fontSize: "13px",
                            resize: "vertical"
                        }}
                    />

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                        <button
                            onClick={handlePreview}
                            disabled={loading || !jsonInput.trim()}
                            style={{
                                flex: 1,
                                padding: "12px",
                                background: "var(--black-lighter)",
                                border: "1px solid var(--black-border)",
                                borderRadius: "8px",
                                color: "var(--text-primary)",
                                cursor: loading || !jsonInput.trim() ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                opacity: loading || !jsonInput.trim() ? 0.5 : 1
                            }}
                        >
                            <Eye size={18} />
                            Preview
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading || !jsonInput.trim() || !result?.preview}
                            className="btn-primary"
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                opacity: loading || !jsonInput.trim() || !result?.preview ? 0.5 : 1
                            }}
                        >
                            {loading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
                            Import
                        </button>
                    </div>
                </div>

                {/* Results / Instructions Section */}
                <div>
                    {/* Results */}
                    {result && (
                        <div className="card" style={{ marginBottom: "24px" }}>
                            <h3 style={{
                                fontFamily: "var(--font-heading)",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                color: result.success ? "#22c55e" : "#ef4444"
                            }}>
                                {result.success ? <Check size={20} /> : <AlertTriangle size={20} />}
                                {result.preview ? "Preview Results" : "Import Results"}
                            </h3>

                            {result.message && (
                                <p style={{ marginBottom: "16px" }}>{result.message}</p>
                            )}

                            {result.validCount !== undefined && (
                                <div style={{
                                    display: "flex",
                                    gap: "16px",
                                    marginBottom: "16px"
                                }}>
                                    <div style={{
                                        padding: "12px 20px",
                                        background: "rgba(34, 197, 94, 0.1)",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(34, 197, 94, 0.2)"
                                    }}>
                                        <div style={{ fontSize: "24px", fontWeight: 700, color: "#22c55e" }}>
                                            {result.importedCount ?? result.validCount}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                            {result.preview ? "Valid" : "Imported"}
                                        </div>
                                    </div>
                                    {(result.invalidCount ?? 0) > 0 && (
                                        <div style={{
                                            padding: "12px 20px",
                                            background: "rgba(239, 68, 68, 0.1)",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(239, 68, 68, 0.2)"
                                        }}>
                                            <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444" }}>
                                                {result.failedCount ?? result.invalidCount}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                {result.preview ? "Invalid" : "Failed"}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Validation Details */}
                            {result.results && result.results.length > 0 && (
                                <div style={{ maxHeight: "300px", overflow: "auto" }}>
                                    {result.results.map((r, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                padding: "12px",
                                                background: r.valid ? "rgba(34, 197, 94, 0.05)" : "rgba(239, 68, 68, 0.05)",
                                                borderRadius: "6px",
                                                marginBottom: "8px",
                                                borderLeft: `3px solid ${r.valid ? "#22c55e" : "#ef4444"}`
                                            }}
                                        >
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                marginBottom: r.errors.length ? "8px" : 0
                                            }}>
                                                {r.valid ? (
                                                    <Check size={16} style={{ color: "#22c55e" }} />
                                                ) : (
                                                    <X size={16} style={{ color: "#ef4444" }} />
                                                )}
                                                <span style={{ fontWeight: 500 }}>{r.title}</span>
                                            </div>
                                            {r.errors.length > 0 && (
                                                <ul style={{
                                                    margin: 0,
                                                    paddingLeft: "24px",
                                                    fontSize: "12px",
                                                    color: "#ef4444"
                                                }}>
                                                    {r.errors.map((err, j) => (
                                                        <li key={j}>{err}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Format Guide */}
                    <div className="card">
                        <h3 style={{
                            fontFamily: "var(--font-heading)",
                            marginBottom: "16px"
                        }}>
                            JSON Format
                        </h3>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                            Provide an array of challenge objects with the following fields:
                        </p>
                        <ul style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            paddingLeft: "20px",
                            marginBottom: "16px"
                        }}>
                            <li><strong>title</strong> (required): Challenge name</li>
                            <li><strong>slug</strong> (required): URL-friendly identifier</li>
                            <li><strong>description</strong> (required): Challenge description</li>
                            <li><strong>categoryName</strong>: Category name (e.g., "Web", "Crypto")</li>
                            <li><strong>difficulty</strong>: MEDIUM, HARD, or GOD_LEVEL</li>
                            <li><strong>points</strong> (required): Point value</li>
                            <li><strong>flag</strong> (required): UG0x1&#123;...&#125; format</li>
                            <li><strong>resourceUrl</strong>: Link to challenge files</li>
                        </ul>

                        <details>
                            <summary style={{ cursor: "pointer", color: "var(--yellow)", fontSize: "13px" }}>
                                View Example JSON
                            </summary>
                            <pre style={{
                                marginTop: "12px",
                                padding: "16px",
                                background: "var(--black-lighter)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                overflow: "auto"
                            }}>
                                {sampleJSON}
                            </pre>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
