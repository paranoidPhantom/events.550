<script lang="ts" setup>
const catchPhrase = "Мероприятия на новом уровне";
const eventConfig = useEventConfig();

const snowDisabled = useCookie<boolean>("snow");
</script>

<template>
    <ClientOnly>
        <div class="branding flex items-center gap-4">
            <img
                v-if="eventConfig?.logo_url"
                :src="eventConfig?.logo_url"
                alt="Logo"
                class="w-24"
                data-aos="flip-up"
            />
            <div class="flex flex-col gap-1">
                <h1 class="text-4xl" data-aos="flip-down" data-aos-delay="100">
                    events.550
                </h1>
                <p data-aos="fade-left" data-aos-delay="200">
                    <span
                        v-for="(word, index) in catchPhrase.split(' ')"
                        :key="index"
                        data-aos="fade"
                        :data-aos-delay="200 + (index + 1) * 100"
                        >{{ word }}&nbsp;</span
                    >
                </p>
            </div>
            <UButton
                icon="mingcute:snow-fill"
                color="white"
                class="ml-auto"
                @click="snowDisabled = snowDisabled ? undefined : 'true'"
            />
        </div>
        <template #fallback>
            <div class="h-36" />
        </template>
    </ClientOnly>
</template>

<style lang="scss" scoped>
.branding {
    font-family: Poiret One;
}
</style>
