<script lang="ts" setup>
const user = useSupabaseUser();
</script>

<template>
    <div class="px-4 sm:px-8 w-full mx-auto max-w-[800px] pt-[10%] space-y-2">
        <Branding />
        <hr class="opacity-10" />
        <AdminNavigation v-if="user" />
        <slot />
        <BrandedFooter />
    </div>
</template>

<style lang="scss"></style>
