"use client";

import { useState } from "react";
import Image from "next/image";

type FutureIssue = {
  id: string;
  title: string;
  release_label: string | null;
  description: string | null;
  cover_url: string | null;
};

type FeaturedVideo = {
  id: string;
  title: string;
  youtube_id: string;
};

export default function FutureIssuesClient({ issues, videos }: { issues: FutureIssue[]; videos: FeaturedVideo[] }) {
  const [activeVideo, setActiveVideo] = useState(0);
  const current = videos[activeVideo];

  return (
    <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
      {/* HERO */}
      <div style={{ background: "var(--void)", padding: "72px 64px 48px", borderBottom: "0.5px solid var(--border)" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>
          Decade of the Spinner
        </p>
        <h1 style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(36px,5vw,60px)", fontWeight: 300, lineHeight: 1.05, color: "var(--white)", marginBottom: 16, maxWidth: 700 }}>
          Future <em style={{ color: "var(--gold)" }}>Issues</em>
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, maxWidth: 620 }}>
          A first look at what&apos;s coming next — upcoming covers, sneak peeks, and the RollersOnly channel playing on the big screen.
        </p>
      </div>

      {/* FUTURE ISSUES SCROLLER */}
      <div style={{ padding: "56px 0 64px" }}>
        <div style={{ padding: "0 64px", marginBottom: 28 }}>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)" }}>Upcoming Issues</div>
        </div>
        {issues.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--muted)", padding: "0 64px" }}>New issues are on the way — check back soon.</p>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 24,
              overflowX: "auto",
              padding: "0 64px 24px",
              scrollbarWidth: "thin",
            }}
          >
            {issues.map((issue) => (
              <div key={issue.id} style={{ flex: "0 0 auto", width: 260 }}>
                <div
                  style={{
                    position: "relative",
                    width: 260,
                    height: 360,
                    borderRadius: 3,
                    overflow: "hidden",
                    background: "var(--surface)",
                    border: "0.5px solid var(--border-gold)",
                    boxShadow: "0 20px 50px -15px rgba(0,0,0,0.8)",
                  }}
                >
                  {issue.cover_url ? (
                    <Image src={issue.cover_url} alt={issue.title} fill style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", fontSize: 13, padding: 20, textAlign: "center" }}>
                      Cover coming soon
                    </div>
                  )}
                  {issue.release_label && (
                    <span style={{ position: "absolute", top: 12, left: 12, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--black)", background: "var(--gold)", padding: "4px 10px", borderRadius: 2 }}>
                      {issue.release_label}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 19, fontWeight: 400, color: "var(--white)", marginBottom: 4 }}>{issue.title}</div>
                  {issue.description && <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{issue.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TV SCREEN */}
      <div style={{ background: "var(--void)", borderTop: "0.5px solid var(--border)", padding: "64px" }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
            The Big Screen
          </p>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, fontWeight: 300, color: "var(--white)" }}>The RollersOnly Channel</div>
        </div>

        {videos.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>No videos are playing yet — check back soon.</p>
        ) : (
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Screen */}
            <div
              style={{
                background: "#000",
                padding: 16,
                borderRadius: 8,
                border: "1px solid var(--border-gold)",
                boxShadow: "0 40px 90px -20px rgba(0,0,0,0.9), 0 0 60px rgba(212,175,55,0.08)",
              }}
            >
              <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 4, overflow: "hidden", background: "#000" }}>
                {current && (
                  <iframe
                    key={current.id}
                    src={`https://www.youtube-nocookie.com/embed/${current.youtube_id}?rel=0`}
                    title={current.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  />
                )}
              </div>
            </div>
            {current && (
              <div style={{ textAlign: "center", marginTop: 18, fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 400, color: "var(--white)" }}>
                {current.title}
              </div>
            )}

            {/* Playlist */}
            {videos.length > 1 && (
              <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "28px 4px 8px", justifyContent: videos.length < 5 ? "center" : "flex-start" }}>
                {videos.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVideo(i)}
                    style={{
                      flex: "0 0 auto",
                      width: 180,
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      opacity: i === activeVideo ? 1 : 0.6,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <div style={{ position: "relative", width: 180, height: 101, borderRadius: 4, overflow: "hidden", border: i === activeVideo ? "2px solid var(--gold)" : "0.5px solid var(--border)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {i === activeVideo && (
                        <span style={{ position: "absolute", bottom: 6, left: 6, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--black)", background: "var(--gold)", padding: "2px 7px", borderRadius: 2 }}>
                          Now Playing
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--white)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
