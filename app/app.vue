<script lang="ts" setup>
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";
import type { Timeline } from "~~/types/events";

// Set up listen for event config and timeline changes
const eventConfig = useEventConfig();
const timeline = useTimeline();
const castOptions = useCastOptions();
const lastTimelineUpdate = useState<number>(
    "state_timeline_last_update",
    () => 0
);

const votes = useState<Array<DBRow<"casts">> | null>("state_votes", () => null);

const supabase = useSupabaseClient<Database>();

const db_realtime = supabase.channel("event_realtime");
const db_realtime_admin = supabase.channel("event_realtime_admin");

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

const adminPerms = useMyPerms();

const adminPermsWatcher = watch(adminPerms, (newPerms) => {
    if (newPerms) {
        adminPermsWatcher.stop();
        db_realtime_admin
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "casts" },
                async (
                    payload: RealtimePostgresChangesPayload<DBRow<"casts">>
                ) => {
                    const { eventType, new: newRow, old: oldRow } = payload;
                    if (eventType === "INSERT") {
                        votes.value?.push(newRow);
                    } else if (eventType === "DELETE") {
                        votes.value = (votes.value ?? []).filter(
                            (vote) => vote.id !== oldRow.id
                        );
                    }
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "cast-options" },
                async (
                    payload: RealtimePostgresChangesPayload<
                        DBRow<"cast-options">
                    >
                ) => {
                    const { eventType, new: newRow, old: oldRow } = payload;
                    if (eventType === "INSERT") {
                        castOptions.value.push(newRow);
                    } else if (eventType === "DELETE") {
                        castOptions.value = castOptions.value.filter(
                            (option) => option.id !== oldRow.id
                        );
                    } else if (eventType === "UPDATE") {
                        castOptions.value = castOptions.value.map((option) =>
                            option.id === newRow.id ? newRow : option
                        );
                    }
                }
            )
            .subscribe();
    }
});

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
        <Head>
            <Link
                rel="icon"
                type="image/png"
                :href="eventConfig?.logo_url ?? '/favicon.svg'"
            />
        </Head>
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

<style lang="scss">
:root {
    interpolate-size: allow-keywords;
}
</style>
