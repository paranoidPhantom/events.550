<script lang="ts" setup>
const alreadyVoted = useCookie<boolean>("voted");
</script>

<template>
    <div class="flex flex-col gap-4 pt-[10%]">
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
