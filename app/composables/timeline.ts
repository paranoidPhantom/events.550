import { useSupabaseClient, useState } from "#imports";
import type { Database } from "~~/supabase/db";
import type { Timeline } from "~~/types/events";

export const useTimelineSetter = (
    timeline: Ref<Timeline | null>,
    lastUpdate: Ref<number>,
    newTimeline: Timeline | null
) => {
    timeline.value =
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
    const lastTimelineUpdate = useState<number>(
        "state_timeline_last_update",
        () => 0
    );

    // Get supabase client
    const supabase = useSupabaseClient<Database>();

    // If cast options are not loaded, fetch them
    const fetchTimeline = async () => {
        const { data, error } = await supabase
            .from("timelines")
            .select()
            .returns<Timeline[]>()
            .maybeSingle();
        if (error) throw error;
        if (data) useTimelineSetter(timeline, lastTimelineUpdate, data);
    };
    if (!timeline.value) fetchTimeline();

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
