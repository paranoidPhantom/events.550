import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~~/supabase/db";
import type { VoteRequestBody } from "~~/types/vote";

export default defineEventHandler(async (event) => {
    const { first_name, last_name, middle_name, turnstile, selection } =
        await readBody<VoteRequestBody>(event);
    if (!first_name || !last_name || !turnstile || !selection) {
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

    const ip = getRequestIP(event);

    const { data: idSearch } = await supabase
        .from("identities")
        .select()
        .eq("first_name", first_name)
        .eq("last_name", last_name)
        .eq("middle_name", middle_name)
        .maybeSingle();

    if (idSearch) {
        const { error } = await supabase.from("casts").insert({
            id: idSearch.id,
            selection_1: selectionArray[0],
            selection_2: selectionArray[1],
            selection_3: selectionArray[2],
            extracted_ip: ip,
        });
        if (error) {
            throw createError({
                statusCode: 409,
                message: error.message,
            });
        }
    }
});
