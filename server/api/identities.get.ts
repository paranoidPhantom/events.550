import { serverSupabaseServiceRole } from "#supabase/server";
import type { Database } from "~~/supabase/db";

export default defineEventHandler(async (event) => {
    // Get supabase client
    const supabase = serverSupabaseServiceRole<Database>(event);

    try {
        const { data: real } = await supabase.from("identities").select();
        const { data: fake } = await supabase.from("fake-identities").select();

        if (real && fake) {
            const combined = real.concat(fake);

            // Shuffle the combined array
            for (let i = combined.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [combined[i], combined[j]] = [combined[j], combined[i]];
            }

            const onlyNecessaryData = combined
                .filter((identity) => !identity.restricted)
                .map((identity) => ({
                    first_name: identity.first_name,
                    last_name: identity.last_name,
                    grade: identity.grade,
                }));

            return onlyNecessaryData;
        } else {
            throw createError({
                statusCode: 500,
                message:
                    "Ошибка на стороне сервера | One of identity array's is falsy",
            });
        }
    } catch {
        throw createError({
            statusCode: 500,
            message:
                "Ошибка на стороне сервера | Catch triggered at identities.get",
        });
    }
});
