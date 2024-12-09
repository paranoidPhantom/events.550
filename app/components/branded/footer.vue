<script lang="ts" setup></script>

<template>
    <footer class="py-8">
        <UCard class="opacity-50 text-sm">
            <p>
                По организационным вопросам:
                <NuxtLink to="mailto:andrei@hudalla.dev"
                    >andrei@hudalla.dev</NuxtLink
                >
            </p>
            <UDivider class="my-4" />
            <p>
                &copy; {{ new Date().getFullYear() }}
                <NuxtLink to="https://hudalla.dev" external
                    >Андрей Худалла</NuxtLink
                >
            </p>
        </UCard>
    </footer>
</template>

<style lang="scss" scoped></style>
