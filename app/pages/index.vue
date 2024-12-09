<script lang="ts" setup>
const alreadyVoted = useCookie<boolean>("voted");
const streamChannelName = "ahudalla";
</script>

<template>
    <div class="flex flex-col gap-4 pt-[10%]">
        <iframe
            :src="`https://live.vkvideo.ru/app/embed/${streamChannelName}`"
            frameborder="0"
            allowfullscreen="true"
            scrolling="no"
            class="w-full aspect-[16/9] rounded-lg"
        />
        <UAlert
            v-if="alreadyVoted"
            color="tree"
            variant="subtle"
            icon="game-icons:vote"
            title="Вы уже проголосовали!"
            description="Думаете что это ошибка? Подойдите к столику поддержки!"
        />
        <UButton to="/vote" :disabled="alreadyVoted" class="w-fit">
            Проголосовать
        </UButton>
    </div>
</template>

<style lang="scss" scoped></style>
