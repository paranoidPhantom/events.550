<script lang="ts" setup>
import type { DBRow } from "~~/supabase/utils";
import type { VoteRequestBody } from "~~/types/vote";

definePageMeta({
    title: "Проголосовать",
});

const state = reactive<VoteRequestBody>({
    first_name: "",
    last_name: "",
    grade: "",
    turnstile: undefined,
    selection: {},
});

const { data: identities } = await useIdentities();

const filteredIdentities = computed(() => {
    if (!state.first_name && !state.last_name && !state.grade)
        return identities.value;
    return identities.value?.filter((identity) => {
        return (
            (!state.first_name ||
                identity.first_name.includes(state.first_name)) &&
            (!state.last_name ||
                identity.last_name.includes(state.last_name)) &&
            (!state.grade || identity.grade === state.grade)
        );
    });
});

const validIdentity = ref(false);
const foundMatch = ref<Partial<DBRow<"identities">>>();

watch(filteredIdentities, (updatedFilteredIdentities) => {
    if (updatedFilteredIdentities?.length === 1) {
        const lastEntry = updatedFilteredIdentities[0];
        if (lastEntry) {
            foundMatch.value = lastEntry;
        }
    }
});

const enumerateNames = (list: typeof identities.value) => {
    if (!list) return { first: [], last: [], grade: [] };
    const first: Set<string> = new Set();
    const last: Set<string> = new Set();
    const grade: Set<string> = new Set();
    list.forEach((identity) => {
        first.add(identity.first_name);
        last.add(identity.last_name);
        grade.add(identity.grade);
    });
    return {
        first: Array.from(first),
        last: Array.from(last),
        grade: Array.from(grade),
    };
};

const nameEnumerators = computed(() => enumerateNames(identities.value));
const filteredNameEnumerators = computed(() =>
    enumerateNames(filteredIdentities.value)
);

const resetState = () => {
    foundMatch.value = undefined;
};

const castOptions = useCastOptions();

const makeSelection = (event: MouseEvent, id: number) => {
    event.stopPropagation();
    state.selection[id] = !state.selection[id];
};

const validSelection = computed(() => {
    return Object.values(state.selection).filter(Boolean).length === 3;
});

const alreadyVoted = useCookie<boolean>("voted");

const toast = useToast();

const turnstile = ref();

const submitVote = async () => {
    try {
        await $fetch("/api/vote", {
            method: "POST",
            body: { ...state, ...foundMatch.value },
        });
        alreadyVoted.value = true;
        navigateTo("/vote/success");
    } catch (error) {
        if (turnstile.value) turnstile.value.reset();
        const { statusCode } = error as { statusCode: number };
        switch (statusCode) {
            case 409:
                toast.add({
                    icon: "mdi-alert-circle",
                    title: "Вы уже проголосовали!",
                    color: "rose",
                    description:
                        "Если вы думаете что это ошибка, подойдите к столику поддержки",
                });
                break;
            case 422:
                toast.add({
                    icon: "mdi-alert-circle",
                    title: "Инвалидные данные!",
                    color: "rose",
                });
                break;
            case 403:
                toast.add({
                    icon: "mdi-alert-circle",
                    title: "Невалидно выполниена капча!",
                    color: "rose",
                });
                break;
            case 404:
                toast.add({
                    icon: "mdi-alert-circle",
                    title: "Голосование на данный момент закрыто!",
                    color: "rose",
                });
                break;
        }
    }
};
</script>

<template>
    <div class="flex flex-col gap-4 relative">
        <TransitionGroup name="slide-in">
            <div
                class="space-y-4 transition-all duration-500 px-2"
                :style="{
                    height: validIdentity ? '0' : 'auto',
                    overflow: validIdentity ? 'hidden' : undefined,
                }"
            >
                <h2 class="text-2xl font-semibold">Введите свои данные</h2>
                <hr class="opacity-10" />
                <UFormGroup label="Класс">
                    <UInputMenu
                        v-model="state.grade"
                        placeholder="7Б"
                        :options="
                            state.grade
                                ? nameEnumerators.grade
                                : filteredNameEnumerators.grade
                        "
                    />
                </UFormGroup>
                <UFormGroup label="Фамилия">
                    <UInputMenu
                        v-model="state.last_name"
                        placeholder="Иванов"
                        :options="
                            state.last_name
                                ? nameEnumerators.last
                                : filteredNameEnumerators.last
                        "
                    />
                </UFormGroup>
                <UFormGroup label="Имя">
                    <UInputMenu
                        v-model="state.first_name"
                        placeholder="Иван"
                        :options="
                            state.first_name
                                ? nameEnumerators.first
                                : filteredNameEnumerators.first
                        "
                    />
                </UFormGroup>
            </div>
            <div v-if="foundMatch" class="flex flex-col gap-4">
                <h2
                    class="text-2xl font-semibold"
                    data-aos="fade-down"
                    data-aos-delay="200"
                >
                    <Transition name="slide-symmetrical" mode="out-in">
                        <span v-if="!validIdentity">
                            О {{ foundMatch.first_name }}, это вы?
                        </span>
                        <span v-else> Выберете 3 лучших выступления </span>
                    </Transition>
                </h2>
                <UCard>
                    <div>
                        <div class="flex gap-4 justify-between mb-6">
                            <UAvatar
                                data-aos="fade-left"
                                data-aos-delay="400"
                                size="xl"
                                :src="`https://robohash.org/${foundMatch.first_name}_${foundMatch.last_name}.png`"
                            />
                            <div
                                class="flex gap-4 items-center"
                                data-aos="fade-right"
                                data-aos-delay="600"
                            >
                                <h4 class="text-xl">
                                    {{ foundMatch.last_name }}
                                    {{ foundMatch.first_name }}
                                </h4>
                                <UBadge
                                    class="w-fit"
                                    variant="subtle"
                                    size="md"
                                >
                                    {{ foundMatch.grade }}
                                </UBadge>
                            </div>
                        </div>
                        <hr class="opacity-10 mb-6" />
                        <Transition name="slide-symmetrical" mode="out-in">
                            <div
                                v-if="!validIdentity"
                                class="flex gap-2 items-center justify-between overflow-hidden"
                            >
                                <UButton
                                    label="Да!"
                                    :disabled="validIdentity"
                                    @click="validIdentity = true"
                                />
                                <UButton
                                    color="rose"
                                    label="Это ошибка"
                                    variant="soft"
                                    :disabled="validIdentity"
                                    @click="resetState"
                                />
                            </div>
                            <div
                                v-else
                                class="flex gap-2 items-center overflow-hidden"
                                :style="{
                                    height: validIdentity ? 'auto' : '0',
                                }"
                            >
                                <UAccordion
                                    :items="
                                        castOptions.map((option) => ({
                                            label: option.name,
                                            ...option,
                                        }))
                                    "
                                >
                                    <template #default="{ item }">
                                        <UButton variant="outline" class="mb-4">
                                            <UCheckbox
                                                size="lg"
                                                :disabled="
                                                    validSelection &&
                                                    !state.selection[item.id]
                                                "
                                                @click="
                                                        (event: MouseEvent) =>
                                                            makeSelection(
                                                                event,
                                                                item.id
                                                            )
                                                    "
                                            />
                                            {{ item.name }}
                                            <UBadge
                                                size="sm"
                                                variant="outline"
                                                class="ml-auto"
                                            >
                                                {{ item.author }}
                                            </UBadge>
                                        </UButton>
                                    </template>
                                    <template #item="{ item }">
                                        <UCarousel
                                            v-slot="{ item: slide }"
                                            :ui="{
                                                container: 'rounded-lg',
                                            }"
                                            :items="item.image_urls"
                                            class="mb-4"
                                        >
                                            <img
                                                width="300"
                                                height="400"
                                                draggable="false"
                                                :src="slide"
                                            />
                                        </UCarousel>
                                        <p>{{ item.description }}</p>
                                    </template>
                                </UAccordion>
                            </div>
                        </Transition>
                    </div>
                </UCard>
            </div>
            <div v-if="validIdentity">
                <NuxtTurnstile
                    ref="turnstile"
                    v-model="state.turnstile"
                    :options="{ language: 'ru' }"
                />
                <UIcon
                    name="svg-spinners:ring-resize"
                    class="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 text-tree-500 -z-10"
                />
            </div>
            <div
                v-if="state.turnstile && validSelection"
                class="flex flex-col gap-4"
            >
                <p class="opacity-50 text-sm">
                    Нажимая кнопку «Проголосовать», вы соглашаетесь с
                    <UButton
                        to="/privacy"
                        variant="link"
                        :padded="false"
                        target="_blank"
                    >
                        Политикой конфеденциальности
                    </UButton>
                </p>
                <UButton
                    size="xl"
                    class="w-fit"
                    icon="line-md:file-document-twotone"
                    @click="submitVote"
                >
                    Проголосовать!
                </UButton>
            </div>
        </TransitionGroup>
    </div>
</template>

<style lang="scss" scoped>
.slide-in-leave-to {
    opacity: 0;
    scale: 0.5;
}

.slide-in-enter-from {
    opacity: 0;
    translate: 0 100%;
    scale: 0.5;
}
.slide-in-enter-active,
.slide-in-leave-active {
    transition: all 0.5s;
}

.slide-symmetrical-enter-from,
.slide-symmetrical-leave-to {
    opacity: 0;
    scale: 0.95;
}

.slide-symmetrical-enter-active,
.slide-symmetrical-leave-active {
    transition: all 0.5s;
}
</style>
