import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~~/supabase/db";
import type { VoteRequestBody } from "~~/types/vote";

export default defineEventHandler(async (event) => {
    const { id, turnstile, selection } = await readBody<VoteRequestBody>(event);
    if (!id || !turnstile || !selection) {
        throw createError({
            statusCode: 422,
            message: "Missing required fields",
        });
    }

    const { success: turnstileSolved } = await verifyTurnstileToken(turnstile);

    if (!turnstileSolved)
        throw createError({
            statusCode: 403,
            message: "Verification failed",
        });

    const supabase = serverSupabaseServiceRole<Database>(event);

    const selectionArray = Array.from(
        new Set(
            Object.keys(selection)
                .map((key) => (selection[Number(key)] ? key : null))
                .filter((key) => key !== null)
        )
    );

    if (selectionArray.length !== 3)
        throw createError({
            statusCode: 422,
            message: "Invalid selection",
        });

    const { error } = await supabase.from("casts").insert({
        id,
        selection_1: selectionArray[0],
        selection_2: selectionArray[1],
        selection_3: selectionArray[2],
    });
    if (error) {
        throw createError({
            statusCode: 409,
            message: error.message,
        });
    }
});
