"use client";

import { useState } from "react";
import { reserveMagazineCopy } from "@/app/actions/magazine";
import styles from "./ReserveForm.module.css";

export default function ReserveForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    const result = await reserveMagazineCopy(email);

    if (result.error) {
      setStatus("error");
      setMessage(result.error);
      return;
    }

    setStatus("done");
    setMessage(
      result.alreadyReserved
        ? "You're already on the list — Issue 1 is coming your way this Spring."
        : "You're on the list. We'll email you the moment Issue 1 ships."
    );
  }

  if (status === "done") {
    return <p className={styles.confirm}>{message}</p>;
  }

  return (
    <>
      <form className={styles.formRow} onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Your email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
        />
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Reserving…" : "Reserve My Copy"}
        </button>
      </form>
      {status === "error" && <p className={styles.error}>{message}</p>}
    </>
  );
}
