<script lang="ts" setup>
definePageMeta({
    layout: "empty",
});

const casts = useVoteStatus();
const castOptions = useCastOptions();

const votes = computed(() => {
    const results: Record<number, number> = {};
    casts.value?.forEach((cast) => {
        if (
            cast.vote?.selection_1 &&
            cast.vote?.selection_2 &&
            cast.vote?.selection_3
        ) {
            if (!results[cast.vote.selection_1]) {
                results[cast.vote?.selection_1] = 0;
            }
            if (!results[cast.vote?.selection_2]) {
                results[cast.vote?.selection_2] = 0;
            }
            if (!results[cast.vote?.selection_3]) {
                results[cast.vote?.selection_3] = 0;
            }
            results[cast.vote?.selection_1] =
                Number(results[cast.vote?.selection_1]) + 1;
            results[cast.vote?.selection_2] =
                Number(results[cast.vote?.selection_2]) + 1;
            results[cast.vote?.selection_3] =
                Number(results[cast.vote?.selection_3]) + 1;
        }
    });
    return results;
});

const topThree = computed(() =>
    Array.from(new Set(Object.values(votes.value))).sort((a, b) => b - a)
);
</script>

<template>
    <div
        class="__results flex items-end justify-center gap-4 py-[10%] h-screen"
    >
        <div
            v-for="option in castOptions.sort(
                (a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0)
            )"
            :key="option.id"
            class="flex flex-col items-center gap-4"
            :style="{
                opacity:
                    topThree[0] === votes[option.id]
                        ? '1'
                        : topThree[1] === votes[option.id]
                        ? '0.8'
                        : topThree[2] === votes[option.id]
                        ? '0.6'
                        : '0.2',
            }"
        >
            <div
                class="w-16 bg-blue-500 transition-all"
                :style="{ height: `${(votes[option.id] ?? 0) * 4}px` }"
            ></div>
            <p class="opacity-50">{{ option.author }}</p>
            <p>{{ votes[option.id] }}</p>
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
