<script lang="ts" setup>
import { useLocalStorage } from "@vueuse/core";
import type { Database } from "~~/supabase/db";
import type { DBRow } from "~~/supabase/utils";

definePageMeta({
    layout: "empty",
});

const supabase = useSupabaseClient<Database>();

const myPerms = useMyPerms();
const eventConfig = useEventConfig();
const identities = useVoteStatus();
const castOptions = useCastOptions();

const currentTab = useLocalStorage("internal_current_tab", () => 0);

const configState = ref<
    Partial<Record<keyof DBRow<"event-config">, string | boolean | undefined>>
>({});

watchEffect(() => {
    if (eventConfig.value) {
        Object.keys(eventConfig.value).forEach(
            (key) =>
                (configState.value[key as keyof DBRow<"event-config">] =
                    eventConfig.value
                        ? eventConfig.value[
                              key as unknown as keyof DBRow<"event-config">
                          ] ?? undefined
                        : "")
        );
    }
});

const changedConfigKeys = computed(() => {
    if (!eventConfig.value) return [];
    return Object.keys(configState.value).filter((key) =>
        eventConfig.value
            ? eventConfig.value[
                  key as unknown as keyof DBRow<"event-config">
              ] !== configState.value[key as keyof DBRow<"event-config">]
            : false
    );
});

const applyConfigChanges = async () => {
    if (changedConfigKeys.value.length === 0 || !eventConfig.value) return;
    const changes = new Map();
    changedConfigKeys.value.forEach((key) => {
        changes.set(
            key,
            configState.value[key as keyof DBRow<"event-config">] ?? null
        );
    });
    const { error } = await supabase
        .from("event-config")
        .update(Object.fromEntries(changes))
        .eq("event", eventConfig.value?.event);
    if (error) {
        toast.add({
            title: "Config update failed",
            description: error.message,
            color: "rose",
        });
    } else {
        toast.add({
            title: "Config updated",
            description: "Changes applied successfully",
            color: "green",
        });
    }
};

const idColumns = [
    {
        label: "Фамилия",
        key: "last_name",
    },
    {
        label: "Имя",
        key: "first_name",
    },
    {
        label: "Класс",
        key: "grade",
    },
    {
        label: "Голос",
        key: "info",
    },
];

const deleteVote = async (id: string) => {
    await supabase.from("casts").delete().eq("id", id);
};

const voteCreationState = ref<Record<string, Record<string, boolean>>>({});

watchEffect(() => {
    if (identities.value) {
        identities.value.forEach((identity) => {
            voteCreationState.value[identity.id] = Object.fromEntries(
                castOptions.value.map((option) => [option.author, false])
            );
        });
    }
});

const createVote = async (user_id: string) => {
    const vote = Object.keys(voteCreationState.value[user_id])
        .filter((key) => voteCreationState.value[user_id][key])
        .map(
            (author) =>
                castOptions.value.find((option) => option.author === author)?.id
        );
    await supabase.from("casts").insert({
        id: user_id,
        selection_1: vote[0],
        selection_2: vote[1],
        selection_3: vote[2],
    });
};

const idQuery = ref("");

const filteredIdentities = computed(() => {
    if (!idQuery.value) {
        return identities.value;
    }

    return (identities.value ?? []).filter((person) => {
        return Object.values(person).some((value) => {
            return String(value)
                .toLowerCase()
                .includes(idQuery.value.toLowerCase());
        });
    });
});

const createUserState = reactive({
    first_name: "",
    last_name: "",
    grade: "",
});

watch(idQuery, (query: string) => {
    const [last_name, first_name, grade] = query.split(" ");
    createUserState.last_name = last_name ?? "";
    createUserState.first_name = first_name ?? "";
    createUserState.grade = grade ?? "";
});

const createUser = async () => {
    await supabase.from("identities").insert({
        last_name: createUserState.last_name,
        first_name: createUserState.first_name,
        grade: createUserState.grade,
    });
    window.location.reload();
};

const castOptionEditState = reactive<{
    open: boolean;
    selectedID: number;
    selectedImages: Record<string, boolean>;
}>({
    open: false,
    selectedID: 0,
    selectedImages: {},
});

const inspectCastOption = (id: number) => {
    castOptionEditState.open = true;
    castOptionEditState.selectedID = id;
    castOptions.value
        .find((option) => option.id === castOptionEditState.selectedID)
        ?.image_urls.forEach((image) => {
            castOptionEditState.selectedImages[image] = true;
        });
};

const saveChangesToCastOption = async (id: number) => {
    const { error } = await supabase
        .from("cast-options")
        .update({
            ...castOptions.value.find((option) => option.id === id),
        })
        .eq("id", id);
    if (error) {
        toast.add({
            title: "Cast option update failed",
            description: error.message,
            color: "rose",
        });
    } else {
        toast.add({
            title: "Cast option updated",
            description: "Changes applied successfully",
            color: "green",
        });
    }
};

const castOptionImages = ref<Array<string>>([]);

onMounted(async () => {
    const { data } = await supabase.storage.from("vote-options").list();

    castOptionImages.value =
        data
            ?.filter((entity) => entity.name !== ".emptyFolderPlaceholder")
            .map(
                (image) =>
                    `https://db.eu1.hudalla.dev/storage/v1/object/public/vote-options/${image.name}`
            ) ?? [];
});

const saveChangesToCastOptionImages = async () => {
    const selectedImages = Object.keys(
        castOptionEditState.selectedImages
    ).filter((image) => castOptionEditState.selectedImages[image]);
    const editedIndex = castOptions.value.findIndex(
        (option) => option.id === castOptionEditState.selectedID
    );

    if (editedIndex !== -1 && castOptions.value[editedIndex])
        castOptions.value[editedIndex].image_urls = selectedImages;
    castOptionEditState.open = false;
};

const uploadPrompt = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
        if (!input.files) return;
        const files = Array.from(input.files);
        const promises = files.map((file) => {
            const path = `T=${Date.now()}_${file.name}`;
            return supabase.storage
                .from("vote-options")
                .upload(path, file)
                .then(() => {
                    castOptionImages.value.push(
                        `https://db.eu1.hudalla.dev/storage/v1/object/public/vote-options/${path}`
                    );
                });
        });
        await Promise.all(promises);
    };
    input.click();
};

const addCastOptionState = reactive({
    name: "",
    description: "",
    author: "",
});

const addCastOption = async () => {
    const { error } = await supabase
        .from("cast-options")
        .insert({ ...addCastOptionState, image_urls: [] });
    if (error) {
        toast.add({
            title: "Cast option creation failed",
            description: error.message,
            color: "rose",
        });
    } else {
        toast.add({
            title: "Cast option created",
            description: "Changes applied successfully",
            color: "green",
        });
        addCastOptionState.name = "";
        addCastOptionState.description = "";
        addCastOptionState.author = "";
    }
};
</script>

<template>
    <div class="p-4">
        <AdminNavigation />
        <UTabs
            v-if="myPerms?.length ?? 0 > 0"
            v-model="currentTab"
            :items="
                myPerms?.map((perm) => ({
                    label: perm.toUpperCase(),
                    key: perm,
                }))
            "
        >
            <template #item="{ item: { key } }">
                <div v-if="key === 'config'" class="space-y-4">
                    <h2 class="text-2xl font-semibold">Мероприятие</h2>
                    <UCard>
                        <div v-if="configState" class="space-y-4">
                            <UFormGroup label="Код мероприятия">
                                <UInput v-model="configState.event" disabled />
                            </UFormGroup>
                            <UFormGroup label="Название мероприятия">
                                <UInput v-model="configState.name" />
                            </UFormGroup>
                            <UFormGroup label="Описание">
                                <UTextarea
                                    v-model="configState.description"
                                    resize
                                />
                            </UFormGroup>
                            <UFormGroup label="URL обложки">
                                <UInput v-model="configState.cover_url" />
                            </UFormGroup>
                            <UFormGroup label="URL логотипа">
                                <UInput v-model="configState.logo_url" />
                            </UFormGroup>
                            <UFormGroup label="Название канала на Twitch">
                                <UInput
                                    v-model="configState.twitch_stream_channel"
                                />
                            </UFormGroup>
                            <UFormGroup label="Ограниченный доступ">
                                <UToggle v-model="configState.restricted" />
                            </UFormGroup>
                            <UFormGroup label="Показывать стрим">
                                <UToggle v-model="configState.stream_shown" />
                            </UFormGroup>
                            <UFormGroup label="Голосование открыто">
                                <UToggle v-model="configState.voting_open" />
                            </UFormGroup>
                            <p v-if="changedConfigKeys.length > 0">
                                Изменено: {{ changedConfigKeys.join(", ") }}
                            </p>
                            <UButton
                                label="Применить изменения"
                                :disabled="changedConfigKeys.length === 0"
                                @click="applyConfigChanges"
                            />
                        </div>
                    </UCard>
                </div>
                <div v-if="key === 'cues'" class="space-y-4">
                    <h2 class="text-2xl font-semibold">
                        Управление состоянием
                    </h2>
                    <UCard>
                        <template #header>
                            <div class="flex justify-between">
                                <div class="flex flex-col gap-2">
                                    <h3 class="text-xl font-semibold">
                                        Текущее состояние
                                    </h3>
                                    <hr class="opacity-10" />
                                    <p>
                                        На сцене:
                                        {{
                                            (
                                                eventConfig?.state as DBRow<"state">
                                            ).stageUpdateContent
                                        }}
                                        ({{
                                            {
                                                video: "Видео",
                                                image: "Картинка",
                                                color: "Цвет",
                                                clear: "Пустота",
                                            }[
                                                (
                                                    eventConfig?.state as DBRow<"state">
                                                ).stageUpdateType ?? "clear"
                                            ]
                                        }})
                                    </p>
                                    <p>
                                        Звук:
                                        {{
                                            decodeURI(
                                                (
                                                    eventConfig?.state as DBRow<"state">
                                                ).audio
                                                    ?.split("/")
                                                    .findLast(() => true) ?? ""
                                            )
                                        }}
                                    </p>
                                    <audio
                                        controls
                                        :src="(eventConfig?.state as DBRow<'state'>).audio ?? ''"
                                    />
                                    <p>
                                        Текст в прямом эфире:
                                        {{
                                            (
                                                eventConfig?.state as DBRow<"state">
                                            ).livestream
                                        }}
                                    </p>
                                    <p>
                                        Статус на домашней:
                                        {{
                                            (
                                                eventConfig?.state as DBRow<"state">
                                            ).website
                                        }}
                                    </p>
                                </div>
                                <div class="flex flex-col gap-2 items-end">
                                    <h3 class="text-xl font-semibold">
                                        Обновить
                                    </h3>
                                    <hr class="opacity-10" />
                                    <UInput
                                        v-model="( eventConfig?.state as DBRow<'state'> ).stageUpdateContent"
                                    />
                                    <p>
                                        Звук:
                                        {{
                                            decodeURI(
                                                (
                                                    eventConfig?.state as DBRow<"state">
                                                ).audio
                                                    ?.split("/")
                                                    .findLast(() => true) ?? ""
                                            )
                                        }}
                                    </p>
                                    <audio
                                        controls
                                        :src="(eventConfig?.state as DBRow<'state'>).audio ?? ''"
                                    />
                                    <p>
                                        Текст в прямом эфире:
                                        {{
                                            (
                                                eventConfig?.state as DBRow<"state">
                                            ).livestream
                                        }}
                                    </p>
                                    <p>
                                        Статус на домашней:
                                        {{
                                            (
                                                eventConfig?.state as DBRow<"state">
                                            ).website
                                        }}
                                    </p>
                                </div>
                            </div>
                        </template>
                    </UCard>
                </div>
                <div v-if="key === 'votes'" class="space-y-4">
                    <h2 class="text-2xl font-semibold">Голоса</h2>
                    <UInput v-model="idQuery" placeholder="Поиск..." />
                    <UTable :rows="filteredIdentities" :columns="idColumns">
                        <template #empty-state>
                            <UCard>
                                <div class="flex items-center gap-4">
                                    <UInput
                                        v-model="createUserState.last_name"
                                        placeholder="Фаимилия"
                                    />
                                    <UInput
                                        v-model="createUserState.first_name"
                                        placeholder="Имя"
                                    />
                                    <UInput
                                        v-model="createUserState.grade"
                                        placeholder="Класс"
                                    />
                                    <UButton
                                        label="Добавить в БД"
                                        @click="createUser"
                                    />
                                </div>
                            </UCard>
                        </template>
                        <template #info-data="{ row }">
                            <div class="actions-list flex items-center gap-4">
                                <template v-if="row.vote">
                                    <UBadge variant="subtle">{{
                                        castOptions.find(
                                            (option) =>
                                                option.id ===
                                                row.vote.selection_1
                                        )?.author
                                    }}</UBadge>
                                    <UBadge variant="subtle">{{
                                        castOptions.find(
                                            (option) =>
                                                option.id ===
                                                row.vote.selection_2
                                        )?.author
                                    }}</UBadge>
                                    <UBadge variant="subtle">{{
                                        castOptions.find(
                                            (option) =>
                                                option.id ===
                                                row.vote.selection_3
                                        )?.author
                                    }}</UBadge>
                                    <UButton
                                        color="red"
                                        variant="soft"
                                        label="Удалить голос"
                                        @click="deleteVote(row.vote.id)"
                                    />
                                </template>
                                <div
                                    v-else
                                    class="flex items-center gap-4 flex-wrap"
                                >
                                    <div
                                        v-for="option in castOptions"
                                        :key="option.id"
                                        class="flex items-center gap-2"
                                    >
                                        <UTooltip :text="option.name">
                                            <UBadge variant="subtle">
                                                <p class="mr-4">
                                                    {{ option.author }}
                                                </p>

                                                <UCheckbox
                                                    v-model="
													(voteCreationState[row.id] as Record<string, boolean>)[
														option.author
													]
												"
                                                    :disabled="
                                                        voteCreationState[
                                                            row.id
                                                        ] &&
                                                        Object.values(
                                                            voteCreationState[
                                                                row.id
                                                            ]
                                                        ).filter(Boolean)
                                                            .length >= 3 &&
                                                        !voteCreationState[
                                                            row.id
                                                        ][option.author] ===
                                                            true
                                                    "
                                                />
                                            </UBadge>
                                        </UTooltip>
                                    </div>
                                    <UButton
                                        color="green"
                                        variant="soft"
                                        label="Создать голос"
                                        :disabled="
                                            Object.values(
                                                voteCreationState[row.id]
                                            ).filter(Boolean).length !== 3
                                        "
                                        @click="createVote(row.id)"
                                    />
                                </div>
                            </div>
                        </template>
                    </UTable>
                </div>
                <div v-if="key === 'vote-options'" class="space-y-4">
                    <h2 class="text-2xl font-semibold">Варианты голосования</h2>
                    <UModal v-model="castOptionEditState.open">
                        <UCard>
                            <div class="flex flex-wrap gap-4 overflow-auto">
                                <div
                                    v-for="(image, index) in castOptionImages"
                                    :key="index"
                                    class="flex flex-col items-center gap-4"
                                >
                                    <img
                                        :key="image"
                                        :src="image"
                                        alt="Image"
                                        class="h-48 transition-all cursor-pointer object-cover"
                                        :style="{
                                            opacity: castOptionEditState
                                                .selectedImages[image]
                                                ? '1'
                                                : '0.5',
                                            filter: castOptionEditState
                                                .selectedImages[image]
                                                ? 'none'
                                                : 'grayscale(100%)',
                                        }"
                                        @click="
                                            castOptionEditState.selectedImages[
                                                image
                                            ] =
                                                !castOptionEditState
                                                    .selectedImages[image]
                                        "
                                    />
                                </div>
                                <div
                                    class="py-4 flex flex-col items-center gap-4 w-full"
                                >
                                    <h3
                                        class="text-center font-semibold text-xl"
                                    >
                                        Добавить изображения
                                    </h3>
                                    <UButton
                                        label="Загрузить"
                                        color="yellow"
                                        icon="material-symbols:database-upload-rounded"
                                        @click="uploadPrompt"
                                    />
                                </div>
                            </div>
                            <hr class="opacity-10 my-2" />
                            <p class="mb-2">
                                Выбрано
                                {{
                                    Object.values(
                                        castOptionEditState.selectedImages
                                    ).filter(Boolean).length
                                }}
                                изображений
                            </p>
                            <UButton
                                label="Применить"
                                color="green"
                                @click="saveChangesToCastOptionImages"
                            />
                        </UCard>
                    </UModal>
                    <div class="flex gap-4 flex-wrap">
                        <UCard
                            v-for="option in castOptions"
                            :key="option.id"
                            class="w-96"
                        >
                            <div class="space-y-4">
                                <UFormGroup label="Название номера">
                                    <UInput v-model="option.name" />
                                </UFormGroup>
                                <UFormGroup label="Описание">
                                    <UTextarea
                                        v-model="option.description"
                                        resize
                                    />
                                </UFormGroup>
                                <UFormGroup label="Исполнитель">
                                    <UInput v-model="option.author" />
                                </UFormGroup>

                                <MonacoEditor
                                    class="h-64"
                                    :model-value="
                                        JSON.stringify(
                                            option.image_urls,
                                            null,
                                            2
                                        )
                                    "
                                    lang="json"
                                    :options="{
                                        readOnly: true,
                                        theme: 'vs-dark',
                                    }"
                                />
                                <div class="flex flex-col gap-4">
                                    <UButton
                                        label="Редактировать медиа список"
                                        color="yellow"
                                        variant="soft"
                                        @click="inspectCastOption(option.id)"
                                    />

                                    <UButton
                                        label="Сохранить"
                                        color="green"
                                        @click="
                                            saveChangesToCastOption(option.id)
                                        "
                                    />
                                </div>
                            </div>
                        </UCard>
                        <UCard class="w-96 h-fit">
                            <div class="space-y-4">
                                <h3 class="text-xl font-semibold">
                                    Создать номер
                                </h3>
                                <hr class="opacity-10 my-4" />
                                <UFormGroup label="Название номера">
                                    <UInput v-model="addCastOptionState.name" />
                                </UFormGroup>
                                <UFormGroup label="Описание">
                                    <UTextarea
                                        v-model="addCastOptionState.description"
                                        resize
                                    />
                                </UFormGroup>
                                <UFormGroup label="Исполнитель">
                                    <UInput
                                        v-model="addCastOptionState.author"
                                    />
                                </UFormGroup>

                                <UButton
                                    label="Добавить"
                                    color="green"
                                    @click="addCastOption"
                                />
                            </div>
                        </UCard>
                    </div>
                </div>
            </template>
        </UTabs>
        <UAlert
            v-else-if="myPerms"
            color="yellow"
            variant="subtle"
            title="Вам еще не выдали права..."
            description="Сообщите свой UID/Почту Андрею"
        />
    </div>
</template>

<style lang="scss" scoped></style>
