<script setup lang="ts">
import type { FormError } from "@nuxt/ui/dist/runtime/types";
import type { RouteLocationRaw } from "#vue-router";
definePageMeta({
    name: "Авторизация",
    layout: "admin",
    middleware: async () => {
        const { auth } = useSupabaseClient();
        const {
            data: { user },
        } = await auth.getUser();
        if (user) {
            return navigateTo("/manage");
        }
    },
});

const toast = useToast();

const { auth } = useSupabaseClient();

const waitingForRes = ref(false);
const {
    query: { callback, message },
} = useRoute();

interface FormState {
    email: string | undefined;
    password: string | undefined;
    error: string | undefined;
}

const state: Ref<FormState> = ref({
    email: undefined,
    password: undefined,
    error: undefined,
});

const validate = (state: FormState): FormError[] => {
    const errors = [];
    if (!state.email)
        errors.push({ path: "email", message: "Обязательное поле" });
    if (!state.password)
        errors.push({ path: "password", message: "Обязательное поле" });
    return errors;
};

async function submit() {
    waitingForRes.value = true;
    if (!state.value.email || !state.value.password) {
        return;
    }
    const { error } = await auth.signInWithPassword({
        email: state.value.email,
        password: state.value.password,
    });
    if (!error) {
        toast.add({
            id: "auth_event",
            title: "Вы успешно вошли",
            icon: "i-heroicons-check-circle",
            timeout: 3000,
        });
        navigateTo(callback ? (callback as RouteLocationRaw) : "/manage");
        return;
    }
    waitingForRes.value = false;
    console.warn(error.message);
    switch (error.message) {
        case "Invalid login credentials": {
            state.value.error = "Неверные логин или пароль";
        }
    }
}
</script>

<template>
    <div class="p-4 sm:p-8 w-full max-w-[400px] mx-auto mt-[20%]">
        <UCard>
            <UForm
                class="space-y-4"
                :validate="validate"
                :state="state"
                @submit="submit"
            >
                <h2 class="text-xl">Авторизуйтесь</h2>
                <UAlert
                    v-if="message && message !== 'undefined'"
                    icon="i-heroicons-lock-closed"
                    color="primary"
                    variant="subtle"
                    :title="(message as string)"
                />
                <hr class="opacity-10" >
                <UFormGroup label="Email" name="email">
                    <UInput v-model="state.email" />
                </UFormGroup>
                <UFormGroup label="Пароль" name="password" :error="state.error">
                    <UInput v-model="state.password" type="password" />
                </UFormGroup>
                <UButton type="submit">
                    <UIcon
                        v-if="waitingForRes"
                        name="svg-spinners:3-dots-scale"
                    />
                    {{ !waitingForRes ? "Войти" : "" }}
                </UButton>
            </UForm>
        </UCard>
    </div>
</template>

<style lang="scss">
.__login {
    display: flex;
    justify-content: center;
}
</style>
