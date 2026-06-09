import { NextRequest, NextResponse } from "next/server";
import {
  ApiHandlerBuilder,
  Context,
  requireAuth,
  requireSupabase,
} from "../../../apiHandlerBuilder";
import { createResponse } from "../../../apiResponse";
import { uploadAvatarCommand } from "../commands";

export const POST = new ApiHandlerBuilder()
  .auth()
  .build(async (req: NextRequest, context: Context) => {
    const auth = requireAuth(context);
    const supabase = requireSupabase(context);

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

    const result = await uploadAvatarCommand(
      auth.userId,
      auth.email ?? "",
      file,
      supabase,
    );

    return createResponse(result, "upload avatar");
  });
