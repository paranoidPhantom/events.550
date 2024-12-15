<script lang="ts" setup>
const eventConfig = useEventConfig();

const isdev = import.meta.dev;

const currentCue = useLatestTimelineCue();
</script>

<template>
    <div class="flex flex-col gap-4">
        <UAlert
            v-if="eventConfig?.restricted"
            title="Мероприятие доступно только для администрации"
            description="Обычный пользователь не увидет данных о мероприятии, т.к. оно пока что ограничено"
            color="yellow"
            variant="subtle"
            icon="pixelarticons:hidden"
        />

        <UAlert
            v-if="!eventConfig"
            title="На данный момент не проводиться мероприятий..."
            description="Заглядывайте позже!"
            icon="game-icons:binoculars"
            variant="soft"
        />

        <UCard v-else class="relative">
            <div class="space-y-2">
                <img
                    v-if="eventConfig.cover_url"
                    class="absolute top-0 left-0 w-full h-60 object-center object-cover rounded-t-lg"
                    :src="eventConfig.cover_url"
                    alt="Cover graphic"
                    style="
                        mask-image: linear-gradient(
                            to bottom,
                            black 0%,
                            black 70%,
                            transparent 98%
                        );
                    "
                />
                <div class="h-52" />
                <h2 class="text-xl font-semibold">{{ eventConfig.name }}</h2>
                <hr class="opacity-10" />
                <p class="opacity-70">
                    {{ eventConfig.description }}
                </p>
            </div>
        </UCard>

        <template
            v-if="
                eventConfig?.vk_stream_shown && eventConfig?.vk_stream_channel
            "
        >
            <UDivider label="Смотрите в прямом эфире" />
            <div class="w-full aspect-[16/9] relative">
                <UIcon
                    name="svg-spinners:ring-resize"
                    class="absolute left-1/2 top-1/2 -translate-x-1/2 text-3xl opacity-50 -z-10"
                />
                <iframe
                    :src="`https://player.twitch.tv/?channel=${
                        eventConfig?.vk_stream_channel
                    }&parent=${
                        isdev ? 'localhost' : 'events.hudalla.dev'
                    }&muted=true`"
                    frameborder="0"
                    allowfullscreen="true"
                    scrolling="no"
                    class="w-full aspect-[16/9] rounded-lg"
                />
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped></style>
