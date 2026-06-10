import { NextRequest, NextResponse } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireAuth,
  requireSupabase,
} from "../apiHandlerBuilder";
import { createResponse } from "../apiResponse";
import { getTypedQuery } from "../wrappers/withValidation";
import { listAudioQuerySchema } from "./schema";
import { uploadAudioCommand, listMyAudioCommand } from "./commands";

export const POST = new ApiHandlerBuilder()
  .auth()
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);

    const formData = await req.formData();
    const file = formData.get("file");
    const jamId = formData.get("jamId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: {
            code: "missing_file",
            message: "Multipart field 'file' is required",
          },
        },
        { status: 400 },
      );
    }

    if (typeof jamId !== "string" || jamId.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "missing_jam_id",
            message: "Multipart field 'jamId' is required",
          },
        },
        { status: 400 },
      );
    }

    const result = await uploadAudioCommand(auth.userId, jamId, file, supabase);

    return createResponse(result, "upload audio", { successStatus: 201 });
  });

export const GET = new ApiHandlerBuilder()
  .auth()
  .validateQuery(listAudioQuerySchema)
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);
    const query = getTypedQuery(context, listAudioQuerySchema);

    const result = await listMyAudioCommand(auth.userId, query.jamId, supabase);

    return createResponse(result, "list my audio");
  });
