import { NextRequest, NextResponse } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireSupabase,
} from "../../../apiHandlerBuilder";
import { createResponse } from "../../../apiResponse";
import { uploadJamPhotoCommand } from "../commands";

export const POST = new ApiHandlerBuilder()
  .auth()
  .build(async (req: NextRequest, context: Context) => {
    const supabase = requireSupabase(context);
    const id = context.params.id as string;

    const formData = await req.formData();
    const file = formData.get("file");

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

    const result = await uploadJamPhotoCommand(
      id,
      file,
      supabase,
      context.auth?.userId,
    );

    return createResponse(result, "upload jam photo");
  });
