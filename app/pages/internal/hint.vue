<script lang="ts" setup>
definePageMeta({
    layout: "empty",
});

const items = useTimelineCues("stageCue");

const currentIndex = computed(
    () => useLatestTimelineCue("stageCue").value?.index
);
</script>

<template>
    <div class="flex flex-col justify-center gap-4 mx-[10%] h-screen" style="">
        <p
            v-for="(item, index) in items.sort((a, b) => a.index - b.index)"
            :key="index"
            class="transition-all"
            :style="{
                opacity: item.index === currentIndex ? 1 : 0.5,
                fontSize: item.index === currentIndex ? '5rem' : '1rem',
            }"
        >
            {{ item.stageCue?.yelp }}
        </p>
    </div>
</template>

<style lang="scss" scoped></style>
