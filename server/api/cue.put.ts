import {
    serverSupabaseServiceRole,
    serverSupabaseUser,
} from "#supabase/server";
import type { Database } from "~~/supabase/db";

export default defineEventHandler(async (event) => {
    const { timelineID, index } = await readBody(event);

    const supabase = serverSupabaseServiceRole<Database>(event);

    const user = await serverSupabaseUser(event);

    const { data: profile } = await supabase
        .from("profiles")
        .select("perms")
        .eq("id", user?.id)
        .maybeSingle();

    if (profile?.perms.includes("cues")) {
        await supabase
            .from("timelines")
            .update({
                step: index,
            })
            .eq("id", timelineID);
    } else {
        throw createError({
            statusCode: 403,
            message: "Forbidden",
        });
    }
});
