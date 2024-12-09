<script lang="ts" setup>
const { auth } = useSupabaseClient();
const user = useSupabaseUser();

const links = [
    {
        label: "Dashboard",
        to: "/manage",
    },
    {
        label: "Home",
        to: "/",
    },
    {
        label: "Logout",
        click: () => {
            auth.signOut();
            window.location.reload();
        },
    },
];

const route = computed(() => useRoute());
</script>

<template>
    <div v-if="user" class="space-y-4 py-4 admin-nav">
        <div class="flex items-center gap-2">
            <UBadge color="gray">{{ user.email }}</UBadge>
            <UBadge color="gray">{{ user.id }}</UBadge>
        </div>
        <div class="flex items-center gap-4">
            <UButtonGroup>
                <UButton
                    v-for="(link, index) in links"
                    v-bind="link"
                    :key="index"
                    :variant="route.path === link.to ? 'solid' : 'outline'"
                    @click="link.click"
                />
            </UButtonGroup>
        </div>
        <hr class="opacity-10" />
    </div>
</template>

<style lang="scss" scoped>
.admin-nav {
    font-family: "Source Code", system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans",
        "Helvetica Neue", sans-serif;
}
</style>
