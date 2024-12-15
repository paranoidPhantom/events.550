<script lang="ts" setup>
definePageMeta({
    layout: "empty",
});

const timeline = useTimeline();
const lastTimelineUpdate = useState<number>("state_timeline_last_update");
const cues = useTimelineCues();

const latestCue = useLatestTimelineCue();
const livestreamCue = useLatestTimelineCue("livestream");

const pendingUpdateStep = ref(false);

const toast = useToast();

const devMode = ref(false);

const confirmGotoCue = async (index: number) => {
    pendingUpdateStep.value = true;
    await $fetch("/api/cue", {
        method: "PUT",
        body: {
            index,
            timelineID: timeline.value?.id,
        },
    });
};

const gotoCue = (event: MouseEvent, index: number) => {
    if (devMode.value && timeline.value) {
        timeline.value.step = index;
        confirmGotoCue(index);
        return;
    }
    if (event.shiftKey) {
        confirmGotoCue(index);
        return;
    }
    toast.add({
        title: "Подтвердите действие",
        description: `Переход на индекс - ${index}`,
        actions: [
            {
                label: "Подтвердить",
                click: () => confirmGotoCue(index),
            },
        ],
    });
};

const editorString = ref("");

watch(latestCue, (cue) => {
    if (cue) {
        editorString.value = JSON.stringify(cue, null, 2);
    }
});
watch(lastTimelineUpdate, () => (pendingUpdateStep.value = false));
</script>

<template>
    <div class="p-4">
        <AdminNavigation />
        <div v-if="timeline?.step" class="space-y-4">
            <h2 class="text-2xl font-semibold">Поток сигналов</h2>
            <UCarousel v-slot="{ item: cue }" :items="cues">
                <UCard
                    :key="cue.index"
                    :ui="{
                        ring:
                            timeline?.step === cue.index
                                ? 'ring-primary-500 dark:ring-primary-400'
                                : timeline?.step && timeline?.step > cue.index
                                ? undefined
                                : 'ring-gray-800 dark:ring-white',
                    }"
                    class="transition-all min-w-64 mr-2 ml-2 my-2"
                >
                    <div class="flex gap-2 flex-col">
                        <p
                            class="text-sm"
                            :style="{
                                opacity:
                                    timeline?.step === cue.index ? '1' : '0.5',
                            }"
                        >
                            {{ cue.index }}
                        </p>
                        <p class="transition-all">
                            {{ cue.comment }}
                        </p>
                        <UButton
                            v-if="timeline.step !== cue.index"
                            icon="mdi:arrow-down"
                            label="Переити"
                            class="w-fit"
                            variant="outline"
                            :loading="pendingUpdateStep"
                            @click="(event) => gotoCue(event, cue.index)"
                        />
                    </div>
                </UCard>
            </UCarousel>
            <hr class="opacity-10" />
            <div class="flex">
                <UCard class="w-full">
                    <template #header>
                        <h2 class="text-xl font-semibold">Текущий сигнал</h2>
                    </template>
                    <UTabs
                        :items="[
                            { label: 'Информация', key: 'human' },
                            { label: 'код', key: 'json' },
                        ]"
                    >
                        <template #item="{ item: { key } }">
                            <div v-if="key === 'human'"></div>
                            <MonacoEditor
                                v-else
                                v-model="editorString"
                                class="h-96 overflow-auto rounded-2xl"
                                lang="json"
                                :options="{ readOnly: true, theme: 'vs-dark' }"
                            />
                        </template>
                    </UTabs>
                </UCard>
            </div>

            <UCard class="w-fit">
                <div class="flex items-center gap-4 mb-4">
                    <UToggle v-model="devMode" />
                    <p class="font-bold">Режим разработки</p>
                </div>
                <p class="w-96 opacity-70">
                    Режим следует включать только при подготовке шоу.
                    Синхронизация с узлами не гарантируется, а критические
                    операции не требуют подтверждения.
                </p>
            </UCard>
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
