import { ApplicationCommandPartial } from "./harmony.ts";

export default [
	{
		name: "help",
		description: "Info regarding the bot & how to play",
	},
	{
		name: 'createpanel',
		description: 'Creates a new panel for the game',
	},
	{
		name: 'stop',
		description: 'Stops the current game',
	},
	{
		name: 'deckinfo',
		description: 'Shows info regarding a deck',
	}
] as ApplicationCommandPartial[]