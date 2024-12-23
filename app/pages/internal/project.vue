<script lang="ts" setup>
definePageMeta({
    layout: "empty",
});

const currentCue = useLatestTimelineCue();
const projection = useLatestTimelineCue("stageDisplay");
</script>

<template>
    <div v-show="projection?.stageDisplay?.content">
        <audio autoplay :src="currentCue?.audio"></audio>
        <img
            v-if="projection?.stageDisplay?.type === 'image'"
            class="h-screen w-screen object-cover"
            :src="projection.stageDisplay.content"
        />
        <video
            class="h-screen w-screen object-cover"
            autoplay
            v-else-if="projection?.stageDisplay?.type === 'video'"
            :src="projection.stageDisplay.content"
        />
        <div
            v-else-if="projection?.stageDisplay?.type === 'color'"
            class="h-screen w-screen"
            :style="{ backgroundColor: projection?.stageDisplay?.content }"
        />
    </div>
</template>

<style lang="scss" scoped></style>
