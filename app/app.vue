<script lang="ts" setup>
useScript({
    src: "https://cdn.jsdelivr.net/npm/@erikwatson/snowfall/dist/snowfall.min.js",
});
useScript({
    src: "/js/activate.js",
    async: true,
});

const colorMode = useColorMode();
colorMode.preference = "dark";
</script>

<template>
    <div class="__root">
        <div
            id="snow-container"
            class="fixed top-0 w-full h-screen z-20 pointer-events-none"
        />
        <NuxtRouteAnnouncer />
        <UNotifications />

        <!-- Actual content -->
        <div class="px-4 sm:px-8 w-full mx-auto max-w-[800px]">
            <NuxtPage />
        </div>
    </div>
</template>

<style lang="scss"></style>
