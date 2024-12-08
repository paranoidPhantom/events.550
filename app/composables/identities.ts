import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";
import { useSupabaseClient, useState } from "#imports";

export const useIdentities = () => {
    // Get global state
    const identities = useState<Array<DBRow<"identities">>>(
        "state_identities",
        () => []
    );

    // Get supabase client
    const supabase = useSupabaseClient<Database>();

    // If identities are not loaded, fetch them
    const fetchIdentities = async () => {
        const { data, error } = await supabase.from("identities").select();
        if (error) throw error;
        identities.value = data;
    };

    if (!identities.value.length) fetchIdentities();

    return identities;
};
