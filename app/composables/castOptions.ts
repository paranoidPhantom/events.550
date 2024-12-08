import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";
import { useSupabaseClient, useState } from "#imports";

export const useCastOptions = () => {
    // Get global state
    const castOptions = useState<Array<DBRow<"cast-options">>>(
        "state_cast_options",
        () => []
    );

    // Get supabase client
    const supabase = useSupabaseClient<Database>();

    // If cast options are not loaded, fetch them
    const fetchCastOptions = async () => {
        const { data, error } = await supabase.from("cast-options").select();
        if (error) throw error;
        castOptions.value = data;
    };

    if (!castOptions.value.length) fetchCastOptions();

    return castOptions;
};
