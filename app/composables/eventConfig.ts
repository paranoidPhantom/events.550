import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";
import { useSupabaseClient, useState } from "#imports";

export const useEventConfig = (special?: string) => {
    // Get global state
    const eventConfig = useState<DBRow<"event-config"> | null>(
        "state_event_config",
        () => null
    );

    // Get supabase client
    const supabase = useSupabaseClient<Database>();

    // If cast options are not loaded, fetch them
    const fetchEventConfig = async () => {
        const { data, error } = await supabase
            .from("event-config")
            .select()
            .maybeSingle();
        if (error) throw error;
        eventConfig.value = data;
    };

    if (!eventConfig.value || special === "refetch") fetchEventConfig();

    return eventConfig;
};
