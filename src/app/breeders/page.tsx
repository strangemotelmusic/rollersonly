import { redirect } from "next/navigation";

// This page used to show a "Top Breeders" leaderboard with fabricated
// sales/rating/win numbers hardcoded against real named individuals (real
// World Cup champions who are not verified RollersOnly sellers). Pulled
// down 2026-09-07 rather than let real customers see fake stats attributed
// to real people. Redirect instead of a bare 404 since it was linked from
// nav/footer for weeks and may be bookmarked or indexed.
export default function BreedersPage() {
  redirect("/browse");
}
