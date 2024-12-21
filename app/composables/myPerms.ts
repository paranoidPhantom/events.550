import { useSupabaseClient, useState } from "#imports";
import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";

export const useMyPerms = () => {
    const myPerms = useState<DBRow<"profiles">["perms"] | null>(
        "state_my_perms",
        () => null
    );
    const supabase = useSupabaseClient<Database>();

    const fetchEventConfig = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select()
            .maybeSingle();
        if (error) throw error;
        myPerms.value = data?.perms ?? null;
    };

    if (!myPerms.value) fetchEventConfig();

    return myPerms;
};
