<script lang="ts" setup>
definePageMeta({
    layout: "empty",
});

const items = [
    "⬇︎ 6Б уходит со сцены",
    "... бла-бла-бла ...",
    "⬆︎ 7Б заходит на сцену",
    "☝️ Встаём на начальные позиции",
    "🚀 Танцуем",
];

const currentIndex = ref(3);
</script>

<template>
    <div class="flex flex-col justify-center gap-4 mx-[10%] h-screen" style="">
        <p
            v-for="(item, index) in items"
            :key="index"
            class="transition-all"
            :style="{
                opacity: index === currentIndex ? 1 : 0.5,
                fontSize: index === currentIndex ? '5rem' : '1rem',
            }"
        >
            {{ item }}
        </p>
        <UButton
            class="w-fit"
            @click="currentIndex = (currentIndex + 1) % items.length"
            >Next
        </UButton>
    </div>
</template>

<style lang="scss" scoped></style>
