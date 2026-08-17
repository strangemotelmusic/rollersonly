"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { updateFeaturedVideoTitle } from "@/app/actions/future-content-admin";

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
  youtube_id: string | null;
  source: string;
  video_url: string | null;
  submittedByName: string | null;
};

// Minimal shape of the bits of the YouTube IFrame API we use.
type YTPlayer = { loadVideoById: (id: string) => void; pauseVideo: () => void; playVideo: () => void; destroy: () => void };

export default function FutureIssuesClient({
  issues,
  videos,
  isAdmin,
  isSignedIn,
}: {
  issues: FutureIssue[];
  videos: FeaturedVideo[];
  isAdmin: boolean;
  isSignedIn: boolean;
}) {
  const [activeVideo, setActiveVideo] = useState(0);
  const [titles, setTitles] = useState(() => Object.fromEntries(videos.map((v) => [v.id, v.title])));
  const current = videos[activeVideo];

  const hasYouTube = videos.some((v) => v.source === "youtube" && v.youtube_id);

  const playerRef = useRef<YTPlayer | null>(null);
  const playerElRef = useRef<HTMLDivElement>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(0);
  const videosRef = useRef(videos);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);
  useEffect(() => {
    activeRef.current = activeVideo;
  }, [activeVideo]);

  function advance() {
    if (videosRef.current.length === 0) return;
    const next = (activeRef.current + 1) % videosRef.current.length;
    activeRef.current = next;
    setActiveVideo(next);
  }

  // Set up the YouTube IFrame API once (only if the rotation has at least one
  // YouTube clip) — the player instance is reused across every YouTube item
  // via loadVideoById, and just paused while an uploaded clip is on screen.
  useEffect(() => {
    if (!hasYouTube) return;
    let cancelled = false;

    function createPlayer() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const YT = (window as any).YT;
      if (cancelled || !playerElRef.current || !YT?.Player) return;
      const firstYouTube = videosRef.current.find((v) => v.source === "youtube" && v.youtube_id);
      if (!firstYouTube?.youtube_id) return;
      playerRef.current = new YT.Player(playerElRef.current, {
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        videoId: firstYouTube.youtube_id,
        playerVars: { autoplay: 1, mute: 1, rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === 0) advance(); // 0 === ENDED
          },
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (w.YT?.Player) {
      createPlayer();
    } else {
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* player may not be initialised yet */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasYouTube]);

  // Whenever the active clip changes, make sure exactly the right player is
  // showing and playing — load/resume the YouTube player for a YouTube clip
  // (pausing the native <video>), or play the native element for an upload
  // (pausing YouTube).
  useEffect(() => {
    if (!current) return;
    if (current.source === "youtube" && current.youtube_id) {
      playerRef.current?.loadVideoById(current.youtube_id);
      nativeVideoRef.current?.pause();
    } else {
      try {
        playerRef.current?.pauseVideo();
      } catch {
        /* player not ready yet */
      }
      const el = nativeVideoRef.current;
      if (el) {
        el.muted = true;
        el.play().catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideo, current?.id]);

  function selectVideo(i: number) {
    activeRef.current = i;
    setActiveVideo(i);
  }

  function prevVideo() {
    if (videos.length === 0) return;
    selectVideo((activeVideo - 1 + videos.length) % videos.length);
  }

  function nextVideo() {
    if (videos.length === 0) return;
    selectVideo((activeVideo + 1) % videos.length);
  }

  // Left/right arrow keys jump between clips whenever the big screen is on
  // the page — a keyboard-friendly alternative to clicking the on-screen
  // arrows or a thumbnail.
  useEffect(() => {
    if (videos.length < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prevVideo();
      if (e.key === "ArrowRight") nextVideo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos.length, activeVideo]);

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
          <div style={{ display: "flex", gap: 24, overflowX: "auto", padding: "0 64px 24px", scrollbarWidth: "thin" }}>
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
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>The RollersOnly Channel</div>
          {isSignedIn && (
            <Link href="/future-issues/submit" className="btn-ghost" style={{ fontSize: 11, padding: "8px 20px" }}>
              Submit Your Video →
            </Link>
          )}
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
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: hasYouTube && current?.source === "youtube" ? "block" : "none" }}>
                  <div ref={playerElRef} style={{ width: "100%", height: "100%" }} />
                </div>
                {current?.source === "upload" && (
                  <video
                    ref={nativeVideoRef}
                    src={current.video_url ?? undefined}
                    onEnded={advance}
                    controls
                    playsInline
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "#000" }}
                  />
                )}

                {videos.length > 1 && (
                  <>
                    <button
                      onClick={prevVideo}
                      title="Previous clip"
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.55)",
                        border: "1px solid rgba(212,175,55,0.4)",
                        color: "var(--white)",
                        fontSize: 20,
                        cursor: "pointer",
                        zIndex: 5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextVideo}
                      title="Next clip"
                      style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.55)",
                        border: "1px solid rgba(212,175,55,0.4)",
                        color: "var(--white)",
                        fontSize: 20,
                        cursor: "pointer",
                        zIndex: 5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>

            {current && (
              <div style={{ textAlign: "center", marginTop: 18 }}>
                {isAdmin ? (
                  <EditableNowPlayingTitle key={current.id} video={current} onSaved={(t) => setTitles((prev) => ({ ...prev, [current.id]: t }))} />
                ) : (
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 400, color: "var(--white)" }}>{titles[current.id] ?? current.title}</div>
                )}
                {current.submittedByName && (
                  <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 4 }}>Submitted by {current.submittedByName}</div>
                )}
                {videos.length > 1 && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, letterSpacing: "0.05em" }}>
                    Playing continuously · {activeVideo + 1} / {videos.length}
                  </div>
                )}
              </div>
            )}

            {/* Playlist */}
            {videos.length > 1 && (
              <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "28px 4px 8px", justifyContent: videos.length < 5 ? "center" : "flex-start" }}>
                {videos.map((v, i) => (
                  <div key={v.id} style={{ flex: "0 0 auto", width: 180 }}>
                    <button onClick={() => selectVideo(i)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", opacity: i === activeVideo ? 1 : 0.6, transition: "opacity 0.2s" }}>
                      <div style={{ position: "relative", width: 180, height: 101, borderRadius: 4, overflow: "hidden", border: i === activeVideo ? "2px solid var(--gold)" : "0.5px solid var(--border)", background: "#000" }}>
                        {v.source === "youtube" && v.youtube_id ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <video src={v.video_url ?? undefined} preload="metadata" muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        {i === activeVideo && (
                          <span style={{ position: "absolute", bottom: 6, left: 6, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--black)", background: "var(--gold)", padding: "2px 7px", borderRadius: 2 }}>
                            Now Playing
                          </span>
                        )}
                      </div>
                    </button>
                    <div style={{ fontSize: 12, color: "var(--white)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {titles[v.id] ?? v.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EditableNowPlayingTitle({ video, onSaved }: { video: FeaturedVideo; onSaved: (title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(video.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!draft.trim() || draft.trim() === video.title.trim()) {
      setEditing(false);
      setDraft(video.title);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateFeaturedVideoTitle(video.id, draft);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(draft.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
            style={{
              background: "var(--surface)",
              border: "0.5px solid var(--border-gold)",
              color: "var(--white)",
              fontFamily: "var(--ff-display)",
              fontSize: 18,
              padding: "6px 12px",
              borderRadius: 2,
              outline: "none",
              textAlign: "center",
              minWidth: 260,
            }}
          />
          <button onClick={save} disabled={saving} className="btn-gold" style={{ fontSize: 11, padding: "8px 16px" }}>
            {saving ? "…" : "Save"}
          </button>
          <button onClick={() => { setEditing(false); setDraft(video.title); }} className="btn-ghost" style={{ fontSize: 11, padding: "8px 16px" }}>
            Cancel
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: "#e8a3a3" }}>{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to rename this clip"
      style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, padding: 0 }}
    >
      <span style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 400, color: "var(--white)" }}>{video.title}</span>
      <span style={{ fontSize: 12, color: "var(--gold)" }}>✎</span>
    </button>
  );
}
