"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function DocsPage() {
  return (
    <div className="rounded-lg border bg-white">
      <SwaggerUI url="/api/openapi" />
    </div>
  );
}
