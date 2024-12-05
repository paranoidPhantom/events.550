<script lang="ts" setup>
import type { Database } from "~~/supabase/db";

const supabase = useSupabaseClient<Database>();

const state = reactive({
    first_name: "",
    last_name: "",
    middle_name: "",
    turnstile: undefined,
});

const { data: identities } = await useAsyncData("identity_list", async () => {
    const { data, error } = await supabase.from("identities").select();
    if (error) throw error;
    return data;
});

const filteredIdentities = computed(() => {
    if (!state.first_name && !state.last_name && !state.middle_name)
        return identities.value;
    return identities.value?.filter((identity) => {
        return (
            (!state.first_name ||
                identity.first_name.includes(state.first_name)) &&
            (!state.last_name ||
                identity.last_name.includes(state.last_name)) &&
            (!state.middle_name ||
                identity.middle_name?.includes(state.middle_name))
        );
    });
});

const validIdentity = ref(false);
const foundMatch = ref<Database["public"]["Tables"]["identities"]["Row"]>();

watch(filteredIdentities, (updatedFilteredIdentities) => {
    if (updatedFilteredIdentities?.length === 1) {
        const lastEntry = updatedFilteredIdentities[0];
        if (lastEntry) {
            foundMatch.value = lastEntry;
        }
    }
});

const nameEnumerators = computed(() => {
    const first: Set<string> = new Set();
    const last: Set<string> = new Set();
    const middle: Set<string> = new Set();
    filteredIdentities.value?.forEach((identity) => {
        first.add(identity.first_name);
        last.add(identity.last_name);
        if (identity.middle_name) middle.add(identity.middle_name);
    });
    return {
        first: Array.from(first),
        last: Array.from(last),
        middle: Array.from(middle),
    };
});

const resetState = () => {
    state.first_name = "";
    state.last_name = "";
    state.middle_name = "";
    foundMatch.value = undefined;
};
</script>

<template>
    <div class="flex justify-center px-4 sm:px-8">
        <div
            class="flex flex-col gap-4 pt-[25%] w-full mx-auto max-w-[800px] relative"
        >
            <TransitionGroup name="slide-in">
                <div v-if="!foundMatch" class="space-y-4">
                    <h2 class="text-2xl font-semibold">Введите свои данные</h2>
                    <hr class="opacity-10" />
                    <UFormGroup label="Фамилия">
                        <UInputMenu
                            v-model="state.last_name"
                            placeholder="Иванов"
                            :options="nameEnumerators.last"
                        />
                    </UFormGroup>
                    <UFormGroup label="Имя">
                        <UInputMenu
                            v-model="state.first_name"
                            placeholder="Иван"
                            :options="nameEnumerators.first"
                        />
                    </UFormGroup>
                    <UFormGroup label="Отчество">
                        <UInputMenu
                            v-model="state.middle_name"
                            placeholder="Иванович"
                            :options="nameEnumerators.middle"
                        />
                    </UFormGroup>
                </div>
                <div class="flex flex-col gap-4" v-else>
                    <h2 class="text-2xl font-semibold">
                        О {{ foundMatch.first_name }}, это вы?
                    </h2>
                    <UCard>
                        <div class="space-y-6">
                            <div class="flex gap-4 justify-between">
                                <UAvatar
                                    size="xl"
                                    class="bg-gray-800"
                                    :src="`https://robohash.org/${foundMatch.id}.png`"
                                />
                                <div class="flex gap-4 items-center">
                                    <h4 class="text-xl">
                                        {{ foundMatch.last_name }}
                                        {{ foundMatch.first_name }}
                                        {{ foundMatch.middle_name }}
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
                            <hr class="opacity-10" />
                            <div
                                class="flex gap-2 items-center justify-between"
                            >
                                <UButton label="Да!" />
                                <UButton
                                    color="rose"
                                    label="Это ошибка"
                                    variant="soft"
                                    @click="resetState"
                                />
                            </div>
                        </div>
                    </UCard>
                </div>
                <div v-if="validIdentity" class="turnstile">
                    <NuxtTurnstile
                        v-model="state.turnstile"
                        :options="{ language: 'ru' }"
                    />
                    <UIcon
                        name="svg-spinners:ring-resize"
                        class="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 text-tree-500 -z-10"
                    />
                </div>
                <UButton
                    v-if="state.turnstile"
                    size="xl"
                    class="w-fit"
                    icon="line-md:file-document-twotone"
                    >Проголосовать!</UButton
                >
            </TransitionGroup>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.turnstile {
    @apply overflow-hidden rounded-xl h-[62px] border-2 dark:border-tree-600 flex items-center justify-center w-[300px];
    filter: sepia(1) hue-rotate(85deg);
}

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
    position: absolute;
    width: 100%;
}

.slide-in-enter-active {
    z-index: -1;
}
</style>
