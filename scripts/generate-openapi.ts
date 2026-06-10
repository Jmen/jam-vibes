import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { openApiDocument } from "../app/api/openapi";

const outDir = join(__dirname, "..", "public");
mkdirSync(outDir, { recursive: true });

const outPath = join(outDir, "openapi.json");
writeFileSync(outPath, JSON.stringify(openApiDocument, null, 2));

console.log(`OpenAPI document written to ${outPath}`);
