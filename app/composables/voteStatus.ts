import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";
import { useSupabaseClient, useState } from "#imports";

export const useVoteStatus = () => {
    // Get global state
    const identities = useState<Array<DBRow<"identities">> | null>(
        "state_identities",
        () => null
    );
    const votes = useState<Array<DBRow<"casts">> | null>(
        "state_votes",
        () => null
    );

    // Get supabase client
    const supabase = useSupabaseClient<Database>();

    const fetchIDs = async () => {
        const { data, error } = await supabase.from("identities").select();
        if (error) throw error;
        identities.value = data;
    };

    if (!identities.value) fetchIDs();

    const fetchVotes = async () => {
        const { data, error } = await supabase.from("casts").select();
        if (error) throw error;
        votes.value = data;
    };

    if (!votes.value) fetchVotes();

    return computed(() =>
        identities.value?.map((identity) => ({
            ...identity,
            vote: votes.value?.find((vote) => vote.id === identity.id),
        }))
    );
};
