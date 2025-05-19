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
            <Transition name="fade" mode="out-in">
                <div v-if="projection?.stageUpdateType === 'image'">
                    <img
                        class="h-screen w-screen"
                        :class="{
                            'object-contain': projection?.overrideObjectFit,
                            'object-cover': !projection?.overrideObjectFit,
                        }"
                        :src="projection?.stageUpdateContent"
                        :key="`img_${projection?.stageUpdateContent}`"
                    />
                </div>
                <video
                    class="h-screen w-screen object-cover"
                    autoplay
                    :loop="projection.stageUpdateLooped"
                    v-else-if="projection?.stageUpdateType === 'video'"
                    :src="projection.stageUpdateContent"
                    :key="`video_${projection?.stageUpdateContent}`"
                />
                <div
                    v-else-if="projection?.stageUpdateType === 'color'"
                    class="h-screen w-screen"
                    :style="{ backgroundColor: projection?.stageUpdateContent }"
                />
            </Transition>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
</style>
