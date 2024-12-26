<script lang="ts" setup>
import type { DBRow } from "~~/supabase/utils";

definePageMeta({
    layout: "empty",
});

const projection = computed(
    () => useEventConfig().value?.state as DBRow<"state">
);
</script>

<template>
    <div class="cursor-none h-screen w-screen bg-black">
        <div v-if="projection?.stageUpdateContent">
            <img
                v-if="projection?.stageUpdateType === 'image'"
                class="h-screen w-screen object-cover"
                :src="projection?.stageUpdateContent"
            />
            <video
                class="h-screen w-screen object-cover"
                autoplay
                v-else-if="projection?.stageUpdateType === 'video'"
                :src="projection.stageUpdateContent"
            />
            <div
                v-else-if="projection?.stageUpdateType === 'color'"
                class="h-screen w-screen"
                :style="{ backgroundColor: projection?.stageUpdateContent }"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
