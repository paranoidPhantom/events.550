<script lang="ts" setup>
definePageMeta({
    layout: "empty",
});
const livestreamCue = useLatestTimelineCue("livestream");

const overlayText = computed(() => {
    return livestreamCue.value?.livestream?.overlayText;
});

onMounted(() => {
    setInterval(() => {
        useTimeline("refetch");
    }, 1000);
});
</script>

<template>
    <div class="h-screen flex items-end p-16">
        <div class="flex items-center gap-4">
            <h1 class="text-5xl font-bold">
                <TransitionGroup name="text">
                    <span
                        v-for="(letter, index) in overlayText"
                        class="letter"
                        :key="`${index}_${letter}_${overlayText}`"
                        :style="{ '--delay': `${index * 0.1 + 0.5}s` }"
                        >{{ letter }}</span
                    >
                </TransitionGroup>
            </h1>
        </div>
    </div>
</template>

<style lang="scss" scoped>
h1 {
    font-family: Raleway;
}

.text-enter-from {
    opacity: 0;
}

.text-enter-to {
    @apply text-9xl;
}

.text-leave-to {
    opacity: 0;
}

.letter {
    transition: all 1s calc(3s - var(--delay)) cubic-bezier(0.4, 0, 0.2, 1);
}

.text-enter-active {
    transition: all 1s var(--delay) cubic-bezier(0.4, 0, 0.2, 1);
}

.letter.text-leave-to {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
