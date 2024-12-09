<script lang="ts" setup>
definePageMeta({
    title: "Голос учтён",
});

const graphic = ref();

onMounted(() => {
    setTimeout(() => {
        graphic.value?.play();
    }, 1000);
});
</script>

<template>
    <div class="flex flex-col items-center gap-4">
        <video ref="graphic" class="w-48" src="/graphics/christmas.webm" />
        <h2 class="text-2xl font-semibold">Ваш голос учтён!</h2>
        <UButton to="/" label="На домашнюю" />
    </div>
</template>

<style lang="scss" scoped></style>
