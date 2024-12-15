<script setup lang="ts">
import type { FormError } from "@nuxt/ui/dist/runtime/types";
import type { RouteLocationRaw } from "#vue-router";
definePageMeta({
    title: "Авторизация",
    middleware: async () => {
        const { auth } = useSupabaseClient();
        const {
            data: { user },
        } = await auth.getUser();
        if (user) {
            return navigateTo("/internal");
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
            color: "emerald",
            timeout: 3000,
        });
        navigateTo(callback ? (callback as RouteLocationRaw) : "/internal");
        return;
    }
    waitingForRes.value = false;
    console.warn(error.message);
    switch (error.message) {
        case "Invalid login credentials": {
            state.value.error = "Неверные логин или пароль";
            break;
        }
        case "Email not confirmed": {
            state.value.error = "verify";
            break;
        }
    }
}

const verifyEmail = () => {
    auth.resend({
        email: state.value.email ?? "",
        type: "signup",
    });
};
</script>

<template>
    <div class="p-4 sm:p-8">
        <UCard>
            <UForm
                class="space-y-4"
                :validate="validate"
                :state="state"
                @submit="submit"
            >
                <div class="flex items-center text-4xl gap-4 opacity-50">
                    <UIcon name="fa6-solid:id-badge" />
                    <UIcon name="material-symbols:key-vertical" />
                </div>
                <h2 class="text-xl">System management authentication</h2>
                <UAlert
                    v-if="message && message !== 'undefined'"
                    icon="i-heroicons-lock-closed"
                    color="primary"
                    variant="subtle"
                    :title="(message as string)"
                />
                <hr class="opacity-10" />
                <UFormGroup label="UID" name="email">
                    <UInput v-model="state.email" />
                </UFormGroup>
                <UFormGroup
                    label="Password"
                    name="password"
                    :error="state.error === 'verify' ? undefined : state.error"
                >
                    <UInput v-model="state.password" type="password" />
                    <UAlert
                        v-if="state.error === 'verify'"
                        class="mt-4"
                        color="primary"
                        variant="subtle"
                        title="Почта не подтверждена!"
                        :actions="[
                            {
                                label: 'Подтвердить',
                                click: verifyEmail,
                            },
                        ]"
                    />
                </UFormGroup>
                <UButton type="submit">
                    <UIcon
                        v-if="waitingForRes"
                        name="svg-spinners:3-dots-scale"
                    />
                    {{ !waitingForRes ? "Authenticate" : "" }}
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
