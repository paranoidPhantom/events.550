import { useFetch } from "#imports";

export const useIdentities = () => {
    return useFetch("/api/identities");
};
