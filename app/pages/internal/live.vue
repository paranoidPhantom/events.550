<script lang="ts" setup>
definePageMeta({
    layout: "empty",
});
const livestreamCue = useLatestTimelineCue("livestream");

const overlayText = computed(() => {
    return livestreamCue.value?.livestream?.overlayText;
});
</script>

<template>
    <div class="h-screen flex items-end p-16">
        <div
            class="backdrop-blur-lg rounded-2xl px-4 py-2 bg-black bg-opacity-20 border-4 border-black border-opacity-20 flex items-center gap-4"
        >
            <img class="w-16" src="/graphics/logo.webp" alt="Logo" />
            <h1 class="text-3xl font-bold">{{ overlayText }}</h1>
        </div>
    </div>
</template>

<style lang="scss" scoped>
h1 {
    font-family: Montserrat;
}
</style>
