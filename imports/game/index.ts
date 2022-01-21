import { UnoGame } from "./class.tsx";
export * from "./interfaces.ts"
export * from "./utils.ts";

export {
	UnoGame,
};

export const games: Map<string, UnoGame> = new Map();
