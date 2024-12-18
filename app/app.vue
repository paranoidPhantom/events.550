<script lang="ts" setup>
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";
import type { Timeline } from "~~/types/events";

// Set up listen for event config and timeline changes
const eventConfig = useEventConfig();
const timeline = useTimeline();
const lastTimelineUpdate = useState<number>(
    "state_timeline_last_update",
    () => 0
);

const supabase = useSupabaseClient<Database>();

const db_realtime = supabase.channel("event_realtime");

const subscribeToDBChanges = () => {
    db_realtime
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "event-config" },
            async (
                payload: RealtimePostgresChangesPayload<DBRow<"event-config">>
            ) => {
                const { eventType, new: newRow, old: oldRow } = payload;
                switch (eventType) {
                    case "INSERT":
                        break;
                    case "UPDATE":
                        if (oldRow.event === eventConfig.value?.event) {
                            eventConfig.value = newRow;
                        }
                        break;
                    case "DELETE":
                        if (oldRow.event === eventConfig.value?.event) {
                            eventConfig.value = null;
                        }
                        break;
                }
            }
        )
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "timelines" },
            async (payload: RealtimePostgresChangesPayload<Timeline>) => {
                const { eventType, new: newRow, old: oldRow } = payload;
                switch (eventType) {
                    case "INSERT":
                        if (newRow.event === eventConfig.value?.event) {
                            useTimelineSetter(
                                timeline,
                                lastTimelineUpdate,
                                newRow
                            );
                        }
                        break;
                    case "UPDATE":
                        if (newRow.event === eventConfig.value?.event) {
                            useTimelineSetter(
                                timeline,
                                lastTimelineUpdate,
                                newRow
                            );
                        }
                        break;
                    case "DELETE":
                        if (oldRow.event === timeline.value?.event) {
                            useTimelineSetter(
                                timeline,
                                lastTimelineUpdate,
                                null
                            );
                            useTimeline();
                        }
                        break;
                }
            }
        )
        .subscribe();
};

onMounted(subscribeToDBChanges);

useScript({
    src: "https://cdn.jsdelivr.net/npm/@erikwatson/snowfall/dist/snowfall.min.js",
});
useScript({
    src: "/js/activate.js",
    async: true,
});

const colorMode = useColorMode();
colorMode.preference = "dark";

const snowDisabled = computed(() => {
    return (
        useCookie<boolean>("snow").value ||
        useRoute().path.startsWith("/internal")
    );
});
</script>

<template>
    <div class="__root">
        <div
            id="snow-container"
            class="fixed top-0 w-full h-screen z-20 pointer-events-none transition-all duration-500"
            :style="{
                opacity: snowDisabled ? 0 : 1,
            }"
        />
        <NuxtRouteAnnouncer />
        <UNotifications />

        <!-- Actual content -->
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
