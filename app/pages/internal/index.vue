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

const toast = useToast();

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

const stopIDWatcher = watchEffect(() => {
    if (identities.value) {
        console.warn("!");
        stopIDWatcher();
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
    if (!idQuery.value || idQuery.value.length < 2) {
        return [];
    }

    return (identities.value ?? []).filter((person) => {
        return (
            person.first_name
                .toLowerCase()
                .includes(idQuery.value.toLowerCase()) ||
            person.grade.toLowerCase().includes(idQuery.value.toLowerCase()) ||
            person.last_name.toLowerCase().includes(idQuery.value.toLowerCase())
        );
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

const sendState = ref<Partial<DBRow<"state">>>({});

watch(
    eventConfig,
    (newConfig) => {
        if (newConfig?.state) {
            sendState.value = { ...(newConfig?.state as DBRow<"state">) };
        }
    },
    {
        deep: true,
    }
);

const filePickerState = reactive<{
    open: boolean;
    filter: (file: { name: string }) => boolean;
    onPick: (url: string) => void;
}>({
    open: false,
    filter: () => true,
    onPick: (url: string) => console.log(url),
});

const { data: files, refresh: refreshFiles } = useAsyncData(async () => {
    const { data } = await supabase.storage.from("attachments").list();
    return data ?? [];
});

const colorPickerState = ref<string>("#000000");

const pushStateToServer = async () => {
    const { error } = await supabase
        .from("event-config")
        .update({
            state: sendState.value,
        })
        .eq("event", eventConfig.value?.event ?? "");
    if (error) {
        toast.add({
            title: "State update failed",
            icon: "mdi:alert-circle",
            description: error.message,
            color: "rose",
        });
    } else {
        toast.add({
            title: "State updated",
            description: "Changes applied successfully",
            color: "green",
        });
    }
};

const { data: presets } = useAsyncData(async () => {
    const { data } = await supabase.from("state").select().order("index", {
        ascending: true,
    });
    return data;
});

const incrementIndex = async () => {
    const { data: nextCueData } = await supabase
        .from("state")
        .select()
        .gt("index", (eventConfig.value?.state as DBRow<"state">)?.index ?? 0)
        .order("index");
    if (!nextCueData) {
        toast.add({
            title: "No next cue found",
            description: "There are no more cues to increment to.",
            color: "yellow",
        });
        return;
    }
    if (nextCueData.length === 0) {
        toast.add({
            title: "No next cue found",
            description: "There are no more cues to increment to.",
            color: "yellow",
        });
        return;
    }
    sendState.value = nextCueData[0];
    await pushStateToServer();
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
                    <UModal v-model="filePickerState.open">
                        <UCard>
                            <div class="flex flex-col gap-4">
                                <h4 class="text-xl font-semibold">Картинки</h4>
                                <img
                                    v-for="file in files
                                        ?.filter(filePickerState.filter)
                                        .filter(
                                            (file) =>
                                                file.name.endsWith('.png') ||
                                                file.name.endsWith('.jpg')
                                        ) ?? []"
                                    :key="file.name"
                                    :src="`https://db.eu1.hudalla.dev/storage/v1/object/public/attachments/${file.name}`"
                                    alt="Image"
                                    class="h-48 cursor-pointer object-cover"
                                    @click="
                                        () => {
                                            filePickerState.open = false;
                                            filePickerState.onPick(
                                                `https://db.eu1.hudalla.dev/storage/v1/object/public/attachments/${file.name}`
                                            );
                                        }
                                    "
                                />
                                <hr class="opacity-10" />
                                <h4 class="text-xl font-semibold">Аудио</h4>
                                <div
                                    v-for="file in files
                                        ?.filter(filePickerState.filter)
                                        .filter((file) =>
                                            file.name.endsWith('.mp3')
                                        ) ?? []"
                                    :key="file.name"
                                    class="flex items-center gap-4"
                                >
                                    <div class="flex flex-col gap-1">
                                        <p>
                                            {{ decodeURI(file.name) }}
                                        </p>

                                        <audio
                                            controls
                                            :src="`https://db.eu1.hudalla.dev/storage/v1/object/public/attachments/${file.name}`"
                                        />
                                    </div>
                                    <UButton
                                        icon="mdi:check"
                                        @click="
                                            () => {
                                                filePickerState.open = false;
                                                filePickerState.onPick(
                                                    `https://db.eu1.hudalla.dev/storage/v1/object/public/attachments/${file.name}`
                                                );
                                            }
                                        "
                                    />
                                </div>
                                <hr class="opacity-10" />
                                <h4 class="text-xl font-semibold">Видео</h4>
                                <div
                                    v-for="file in files
                                        ?.filter(filePickerState.filter)
                                        .filter((file) =>
                                            file.name.endsWith('.mp4')
                                        ) ?? []"
                                    :key="file.name"
                                    class="flex flex-col gap-4"
                                >
                                    <video
                                        controls
                                        :src="`https://db.eu1.hudalla.dev/storage/v1/object/public/attachments/${file.name}`"
                                    />
                                    <UButton
                                        icon="mdi:check"
                                        class="w-fit"
                                        @click="
                                            () => {
                                                filePickerState.open = false;
                                                filePickerState.onPick(
                                                    `https://db.eu1.hudalla.dev/storage/v1/object/public/attachments/${file.name}`
                                                );
                                            }
                                        "
                                    />
                                </div>
                                <template
                                    v-if="
                                        filePickerState.filter({
                                            name: 'color',
                                        })
                                    "
                                >
                                    <hr class="opacity-10" />
                                    <h4 class="text-xl font-semibold">Цвет</h4>
                                    <UButtonGroup class="w-full">
                                        <UInput
                                            v-model="colorPickerState"
                                            class="w-full"
                                            type="color"
                                            :ui="{ base: 'h-12' }"
                                        />
                                        <UButton
                                            icon="mdi:check"
                                            @click="
                                                () => {
                                                    filePickerState.open = false;
                                                    filePickerState.onPick(
                                                        colorPickerState
                                                    );
                                                }
                                            "
                                        />
                                    </UButtonGroup>
                                </template>
                            </div>
                        </UCard>
                    </UModal>
                    <h2 class="text-2xl font-semibold">
                        Управление состоянием
                    </h2>
                    <UCard>
                        <template #header>
                            <div
                                v-if="eventConfig?.state"
                                class="flex flex-col gap-2"
                            >
                                <hr class="opacity-10" />
                                <p>
                                    <span class="opacity-50"> На сцене:</span>
                                    {{
                                        (eventConfig?.state as DBRow<"state">)
                                            .stageUpdateContent
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
                                    }}{{
                                        (eventConfig?.state as DBRow<"state">)
                                            .stageUpdateLooped
                                            ? ", зациклено"
                                            : ""
                                    }})
                                </p>
                                <p>
                                    <span class="opacity-50"> Звук:</span>
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
                                    class="w-full"
                                    controls
                                    :src="(eventConfig?.state as DBRow<'state'>).audio ?? ''"
                                />
                                <p>
                                    <span class="opacity-50">
                                        Текст в прямом эфире:</span
                                    >
                                    {{
                                        (eventConfig?.state as DBRow<"state">)
                                            .livestream
                                    }}
                                </p>
                                <p>
                                    <span class="opacity-50"
                                        >Статус на домашней:</span
                                    >
                                    {{
                                        (eventConfig?.state as DBRow<"state">)
                                            .website
                                    }}
                                </p>
                                <UBadge
                                    class="w-fit"
                                    size="lg"
                                    variant="outline"
                                >
                                    {{
                                        (eventConfig.state as DBRow<"state">)
                                            .label
                                    }}
                                </UBadge>
                            </div>
                            <UButton
                                variant="outline"
                                label="Сброс"
                                icon="line-md:arrow-align-left"
                                @click="sendState = eventConfig?.state"
                            />
                            <hr class="opacity-10" />
                            <div class="flex flex-col gap-2">
                                <UButtonGroup class="w-full">
                                    <UButton
                                        label="Выбрать аудио файл"
                                        class="w-fit"
                                        variant="soft"
                                        @click="
                                            () => {
                                                refreshFiles();
                                                filePickerState.open = true;
                                                filePickerState.filter = (
                                                    file
                                                ) => file.name.endsWith('.mp3');
                                                filePickerState.onPick = (
                                                    url
                                                ) => (sendState.audio = url);
                                            }
                                        "
                                    >
                                        {{
                                            decodeURI(
                                                sendState.audio
                                                    ?.split("/")
                                                    .findLast(() => true) ??
                                                    "Выбрать аудио файл"
                                            )
                                        }}
                                    </UButton>
                                    <UButton
                                        v-if="sendState?.audio !== 
                                            (eventConfig?.state as DBRow<'state'>)?.audio"
                                        label="Не менять"
                                        @click="
                                            sendState.audio = (
                                                eventConfig?.state as DBRow<'state'>
                                            )?.audio
                                        "
                                    />
                                </UButtonGroup>
                                <UButtonGroup class="w-full">
                                    <UButton
                                        label="Выбрать визуальный файл"
                                        class="w-fit"
                                        variant="soft"
                                        @click="
                                            () => {
                                                refreshFiles();
                                                filePickerState.open = true;
                                                filePickerState.filter = (
                                                    file
                                                ) =>
                                                    file.name.endsWith(
                                                        '.png'
                                                    ) ||
                                                    file.name.endsWith(
                                                        '.jpg'
                                                    ) ||
                                                    file.name.endsWith(
                                                        '.mp4'
                                                    ) ||
                                                    file.name === 'color';
                                                filePickerState.onPick = (
                                                    url
                                                ) => {
                                                    sendState.stageUpdateContent =
                                                        url;
                                                    if (
                                                        url.endsWith('.png') ||
                                                        url.endsWith('.jpg')
                                                    ) {
                                                        sendState.stageUpdateType =
                                                            'image';
                                                    } else if (
                                                        url.endsWith('.mp4')
                                                    ) {
                                                        sendState.stageUpdateType =
                                                            'video';
                                                    } else {
                                                        sendState.stageUpdateType =
                                                            'color';
                                                    }
                                                };
                                            }
                                        "
                                    >
                                        {{ sendState.stageUpdateContent }}
                                        ({{
                                            {
                                                video: "Видео",
                                                image: "Картинка",
                                                color: "Цвет",
                                                clear: "Пустота",
                                            }[
                                                sendState.stageUpdateType ??
                                                    "clear"
                                            ]
                                        }})
                                    </UButton>
                                    <UButton
                                        v-if="sendState?.stageUpdateType !== 
                                            (eventConfig?.state as DBRow<'state'>)?.stageUpdateType || sendState?.stageUpdateContent !== 
                                            (eventConfig?.state as DBRow<'state'>)?.stageUpdateContent"
                                        label="Не менять"
                                        @click="() => {
                                            sendState.stageUpdateType = (
                                                eventConfig?.state as DBRow<'state'>
                                            )?.stageUpdateType
                                            sendState.stageUpdateContent = (
                                                eventConfig?.state as DBRow<'state'>
                                            )?.stageUpdateContent
										}
                                        "
                                    />
                                </UButtonGroup>
                            </div>
                            <UFormGroup label="Зациклить видео">
                                <UToggle
                                    v-model="sendState.stageUpdateLooped"
                                />
                            </UFormGroup>
                            <UFormGroup label="Текст на прямом эфире">
                                <UButtonGroup class="w-full">
                                    <UInput
                                        v-model="sendState.livestream"
                                        class="w-full"
                                        :placeholder="
                                            sendState.livestream === undefined
                                                ? 'Не будет изменено'
                                                : 'Будет изменено на пустую строку'
                                        "
                                    />
                                    <UButton
                                        v-if="
                                            sendState?.livestream !==
                                            (eventConfig?.state as DBRow<'state'>)?.livestream
                                        "
                                        label="Не менять"
                                        @click="
                                            sendState.livestream = (
                                                eventConfig?.state as DBRow<'state'>
                                            )?.livestream
                                        "
                                    />
                                </UButtonGroup>
                            </UFormGroup>
                            <UFormGroup label="Текст на сайте">
                                <UButtonGroup class="w-full">
                                    <UInput
                                        v-model="sendState.website"
                                        class="w-full"
                                        :placeholder="
                                            sendState.website === undefined
                                                ? 'Не будет изменено'
                                                : 'Будет изменено на пустую строку'
                                        "
                                    />
                                    <UButton
                                        v-if="sendState?.website !== 
                                            (eventConfig?.state as DBRow<'state'>)?.website"
                                        label="Не менять"
                                        @click="
                                            sendState.website = (
                                                eventConfig?.state as DBRow<'state'>
                                            )?.website
                                        "
                                    />
                                </UButtonGroup>
                            </UFormGroup>
                            <hr class="opacity-20 w-48 my-4" />
                            <UButton
                                size="lg"
                                icon="tabler:stack-push"
                                label="ПРИМЕНИТЬ"
                                :disabled="sendState.audio === (eventConfig?.state as DBRow<'state'>).audio && sendState.livestream === (eventConfig?.state as DBRow<'state'>).livestream && sendState.stageUpdateContent === (eventConfig?.state as DBRow<'state'>).stageUpdateContent && sendState.stageUpdateLooped === (eventConfig?.state as DBRow<'state'>).stageUpdateLooped && sendState.website === (eventConfig?.state as DBRow<'state'>).website"
                                @click="pushStateToServer"
                            />
                            <hr class="opacity-20 w-48 my-4" />
                            <UButton
                                size="lg"
                                icon="material-symbols:read-more"
                                label="ИНКРМЕНТАЦИЯ"
                                color="green"
                                @click="incrementIndex"
                            />
                        </template>
                        <template #footer>
                            <h3 class="text-xl font-semibold">Пресеты</h3>
                            <hr class="opacity-10 my-4" />
                            <div class="flex flex-wrap gap-2 select-none">
                                <UCard
                                    v-for="preset in presets"
                                    :key="preset.id"
                                    class="cursor-pointer"
                                    @click="
                                        (event: MouseEvent) => {
                                            sendState = preset;
											if (event.shiftKey || event.pointerType !== 'mouse') pushStateToServer()
                                        }
                                    "
                                >
                                    <div class="flex flex-col gap-2">
                                        <p class="text-xl">
                                            {{ preset.label }}
                                        </p>
                                        <UBadge variant="subtle" size="lg">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <UIcon
                                                    name="heroicons:speaker-wave-16-solid"
                                                />
                                                <p>
                                                    {{
                                                        preset.audio
                                                            ?.split("/")
                                                            .findLast(
                                                                () => true
                                                            )
                                                    }}
                                                </p>
                                            </div>
                                        </UBadge>
                                        <UBadge variant="subtle" size="lg">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <UIcon
                                                    name="heroicons:photo-16-solid"
                                                />
                                                <p>
                                                    {{
                                                        preset.stageUpdateContent
                                                            ?.split("/")
                                                            .findLast(
                                                                () => true
                                                            )
                                                    }}

                                                    ({{
                                                        {
                                                            video: "Видео",
                                                            image: "Картинка",
                                                            color: "Цвет",
                                                            clear: "Пустота",
                                                        }[
                                                            preset.stageUpdateType ??
                                                                "clear"
                                                        ]
                                                    }}{{
                                                        preset.stageUpdateLooped
                                                            ? ", зациклено"
                                                            : ""
                                                    }})
                                                </p>
                                            </div>
                                        </UBadge>
                                        <UBadge variant="subtle" size="lg">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <UIcon
                                                    name="heroicons:video-camera"
                                                />
                                                <p>
                                                    {{ preset.livestream }}
                                                </p>
                                            </div>
                                        </UBadge>
                                        <UBadge variant="subtle" size="lg">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <UIcon
                                                    name="heroicons:chat-bubble-bottom-center-text"
                                                />
                                                <p>
                                                    {{ preset.website }}
                                                </p>
                                            </div>
                                        </UBadge>
                                    </div>
                                </UCard>
                            </div>
                        </template>
                    </UCard>
                </div>
                <div v-if="key === 'votes'" class="space-y-4">
                    <h2 class="text-2xl font-semibold">Голоса</h2>
                    <UInput v-model="idQuery" placeholder="Поиск..." />
                    <UTable :rows="filteredIdentities" :columns="idColumns">
                        <template #empty-state>
                            <UCard class="mt-4">
                                <div
                                    v-if="idQuery && idQuery.length >= 2"
                                    class="flex items-center gap-4"
                                >
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
                                <p v-else>Поиск начинается с 2-х символов,</p>
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
