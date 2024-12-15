import { useSupabaseClient, useState } from "#imports";
import type { Database } from "~~/supabase/db";
import type { Timeline } from "~~/types/events";

const timelineState = () =>
    useState<Timeline | null>("state_timeline", () => null);

export const useTimelineSetter = (newTimeline: Timeline | null) => {
    const lastUpdate = useState<number>("state_timeline_last_update", () => 0);

    timelineState().value =
        newTimeline === null
            ? null
            : {
                  ...newTimeline,
                  cues:
                      newTimeline.cues.sort((a, b) => a.index - b.index) ?? [],
              };
    lastUpdate.value = Date.now();
};

export const useTimeline = () => {
    // Get global state
    const timeline = useState<Timeline | null>("state_timeline", () => null);

    // Get supabase client
    const supabase = useSupabaseClient<Database>();

    callOnce("fetch_timeline", async () => {
        const { data, error } = await supabase
            .from("timelines")
            .select()
            .returns<Timeline[]>()
            .maybeSingle();
        if (error) throw error;
        if (data) useTimelineSetter(data);
    });

    return timeline;
};

export const useTimelinePush = async () => {};

export const useTimelineCues = (criterion?: keyof Timeline["cues"][number]) => {
    return computed(() => {
        // Get all cues from timeline, or empty array if timeline doesn't exist
        const cues = useTimeline().value?.cues ?? [];
        // If criterion is provided, filter cues that have that property
        return criterion ? cues.filter((cue) => cue[criterion]) : cues;
    });
};

export const useLatestTimelineCue = (
    criterion?: keyof Timeline["cues"][number]
) => {
    return computed(() => {
        // Get current step from timeline
        const step = useTimeline().value?.step;
        if (!step) return null;
        // Get filtered cues based on criterion
        const cues = useTimelineCues(criterion).value;
        const priorCues = cues.filter((cue) => cue.index <= step);
        return priorCues.pop() ?? null;
    });
};
