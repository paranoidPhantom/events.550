// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2024-11-01",
    devtools: { enabled: true },
    modules: [
        "@nuxt/fonts",
        "@nuxtjs/supabase",
        "@nuxt/eslint",
        "@nuxtjs/turnstile",
        "@nuxt/ui",
        "nuxt-aos",
    ],
    future: {
        compatibilityVersion: 4,
    },
    supabase: {
        redirect: true,
        redirectOptions: {
            login: "/auth",
            callback: "/confirm",
            include: ["/auth"],
        },
    },
});
