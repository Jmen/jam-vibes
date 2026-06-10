import { NextResponse } from "next/server";
import { openApiDocument } from "../openapi";

export async function GET() {
  return NextResponse.json(openApiDocument);
}
