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
        "@nuxtjs/seo",
        "nuxt-monaco-editor",
    ],
    future: {
        compatibilityVersion: 4,
    },
    supabase: {
        redirect: true,
        redirectOptions: {
            login: "/auth",
            callback: "/confirm",
            include: ["/internal"],
        },
    },
    turnstile: {
        secretKey: process.env.NUXT_TURNSTILE_SECRET_KEY,
    },
    routeRules: {
        "/internal": {
            ssr: false,
        },
    },
    css: ["~/assets/global.scss"],
    app: {
        pageTransition: {
            name: "page",
            mode: "out-in",
        },
    },
    site: {
        name: "events.550",
        description: "",
    },
});
