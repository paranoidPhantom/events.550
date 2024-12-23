<script lang="ts" setup>
import type { DBRow } from "~~/supabase/utils";

const audio = ref<HTMLAudioElement | null>();

definePageMeta({
    layout: "empty",
});

const projection = computed(
    () => useEventConfig().value?.state as DBRow<"state">
);

const updateAudio = (
    newProjection: (typeof projection)["value"],
    override?: string
) => {
    const newSrc = newProjection?.audio;
    if (audio.value && newSrc) {
        const element = audio.value;
        let count = 0;
        const changeLevels = (direction: "up" | "down") => {
            element.volume = direction === "down" ? 1 - count / 10 : count / 10;
            count++;
            if (count < 10) setTimeout(() => changeLevels(direction), 100);
            else if (direction === "down") {
                count = 0;
                element.setAttribute("src", newSrc);
                element.play();
                changeLevels("up");
            }
        };
        changeLevels("down");
    }
};

watch(projection, (newProjection) => updateAudio(newProjection));

const stop = watchEffect(() => {
    if (projection.value && audio.value) {
        stop();
        updateAudio(projection.value, "first");
    }
});
</script>

<template>
    <div class="cursor-none h-screen w-screen bg-black">
        <audio ref="audio" />
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
