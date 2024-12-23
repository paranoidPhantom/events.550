<script lang="ts" setup>
definePageMeta({
    layout: "empty",
});

const currentCue = useLatestTimelineCue();
const projection = useLatestTimelineCue("stageDisplay");
</script>

<template>
    <div v-show="projection?.stageDisplay?.content">
        <audio :src="currentCue?.audio"></audio>
        <img
            v-if="projection?.stageDisplay?.type === 'image'"
            class="h-screen w-full object-cover"
            :src="projection.stageDisplay.content"
        />
        <video
            class="h-screen object-cover"
            v-else-if="projection?.stageDisplay?.type === 'video'"
            :src="projection.stageDisplay.content"
        />
        <div
            v-else-if="projection?.stageDisplay?.type === 'color'"
            class="h-screen"
            :style="{ backgroundColor: projection?.stageDisplay?.content }"
        />
    </div>
</template>

<style lang="scss" scoped></style>
