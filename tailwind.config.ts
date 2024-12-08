import type { Config } from "tailwindcss";

export default <Partial<Config>>{
    theme: {
        extend: {
            colors: {
                tree: {
                    "50": "#fff0f2",
                    "100": "#ffdde1",
                    "200": "#ffc1c9",
                    "300": "#ff95a3",
                    "400": "#ff596f",
                    "500": "#ff2642",
                    "600": "#fc0626",
                    "700": "#d6001c",
                    "800": "#af051b",
                    "900": "#900c1d",
                    "950": "#50000a",
                },
            },
        },
    },
};
