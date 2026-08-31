"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-wrap">
      <section className="page-error" role="alert">
        <span><TriangleAlert size={25} aria-hidden="true" /></span>
        <h1>Something went wrong</h1>
        <p>The service may be temporarily unavailable. Try the request again in a moment.</p>
        <Button className="primary-button" onClick={reset}><RotateCcw size={16} />Try again</Button>
      </section>
    </div>
  );
}
