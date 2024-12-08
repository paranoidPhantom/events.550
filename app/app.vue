<script lang="ts" setup>
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";

// Manage global state

const supabase = useSupabaseClient<Database>();
const identities = useIdentities();

onMounted(() => {
    supabase
        .channel("identities_realtime")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "identities" },
            async (
                payload: RealtimePostgresChangesPayload<DBRow<"identities">>
            ) => {
                const { eventType, new: newRow, old: oldRow } = payload;
                if (eventType === "INSERT") {
                    identities.value.push(newRow);
                } else if (eventType === "UPDATE") {
                    const index = identities.value.findIndex(
                        (identity) => identity.id === oldRow.id
                    );
                    if (index !== -1) {
                        identities.value[index] = newRow;
                    }
                } else if (eventType === "DELETE") {
                    identities.value = identities.value.filter(
                        (identity) => identity.id !== oldRow.id
                    );
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
    defer: true,
});

const colorMode = useColorMode();
colorMode.preference = "dark";
</script>

<template>
    <div class="__root">
        <NuxtRouteAnnouncer />
        <NuxtPage />
    </div>
</template>
