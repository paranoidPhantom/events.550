import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";
import { useSupabaseClient, useState } from "#imports";

export const useEventState = () => {
    // Get global state
    const eventState = useState<Array<DBRow<"state">> | null>(
        "event_state",
        () => null
    );

    // Get supabase client
    const supabase = useSupabaseClient<Database>();

    // If cast options are not loaded, fetch them
    const fetchEventState = async () => {
        const { data, error } = await supabase.from("state").select();
        if (error) throw error;
        eventState.value = data;
    };

    if (!eventState.value) fetchEventState();

    return eventState;
};
