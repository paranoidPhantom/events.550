export interface VoteState {
    first_name: string;
    last_name: string;
    middle_name: string;
    turnstile: string | undefined;
    selection: Record<number, boolean>;
}

export interface VoteRequestBody extends VoteState {
    id: string;
}
