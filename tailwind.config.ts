import type { Config } from "tailwindcss";

export default <Partial<Config>>{
    theme: {
        extend: {
            colors: {
                tree: {
                    "50": "#edfcf4",
                    "100": "#d4f7e3",
                    "200": "#9eeac3",
                    "300": "#77deb0",
                    "400": "#40c78f",
                    "500": "#1dac75",
                    "600": "#108b5f",
                    "700": "#0d6f4e",
                    "800": "#0d583f",
                    "900": "#0b4935",
                    "950": "#05291e",
                },
            },
        },
    },
};
