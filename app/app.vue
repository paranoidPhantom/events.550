<script lang="ts" setup>
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";

// Set up listen for event config changes
const eventConfig = useEventConfig();

const supabase = useSupabaseClient<Database>();

onMounted(() => {
    supabase
        .channel("event_config_realtime")
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
        .subscribe();
});

useScript({
    src: "https://cdn.jsdelivr.net/npm/@erikwatson/snowfall/dist/snowfall.min.js",
});
useScript({
    src: "/js/activate.js",
    async: true,
});

const colorMode = useColorMode();
colorMode.preference = "dark";

const user = useSupabaseUser();

const snowDisabled = useCookie<boolean>("snow");
</script>

<template>
    <div class="__root">
        <div
            v-show="!snowDisabled"
            id="snow-container"
            class="fixed top-0 w-full h-screen z-20 pointer-events-none"
        />
        <NuxtRouteAnnouncer />
        <UNotifications />

        <!-- Actual content -->
        <div
            class="px-4 sm:px-8 w-full mx-auto max-w-[800px] pt-[10%] space-y-2"
        >
            <Branding />
            <hr class="opacity-10" />
            <AdminNavigation v-if="user" />
            <NuxtPage />
            <BrandedFooter />
        </div>
    </div>
</template>

<style lang="scss"></style>
