import { Embed, MessageComponentBase, ButtonStyle, TextChannel, GuildTextChannel, Guild, User, Message } from "harmony";
import { DeckType } from "deck";

export class UnoGame {
	public players: string[] = [];
	public message?: Message;

	constructor(
		private guildID: Guild,
		private channel: TextChannel | GuildTextChannel,
		public creator: {
			name: string;
			id: string;
			user: User
		},
		public readonly deckType: DeckType
	) {}

	public getLobbyEmbedAndButton(): {
		embed: Embed;
		components: MessageComponentBase[];
	} {
		return {
			embed: new Embed({
				title: "Uno Game",
				description: `${this.creator.name} has started a game of UNO!\nTo join their game press the \`Join Game\` button below.`,
				fields: [
					{
						name: "Players",
						value: `${this.players.map((u) => `<@!${u}>`).join("\n")}`,
					},
				],
				footer: {
					text: "Needed players: 3",
				},
			}).setColor("GREEN"),
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							label: "Join Game",
							style: ButtonStyle.BLURPLE,
							custom_id: "join",
						},
						{
							type: 2,
							label: "Start Game",
							style: ButtonStyle.BLURPLE,
							custom_id: "start",
						},
					],
				},
			],
		}
	}
}

export const getPanelEmbedAndButtons = (): {
	embed: Embed;
	components: MessageComponentBase[];
} => {
	return {
		embed: new Embed({
			author: {
				name: "DisUNO",
			},
			title: "Start a game of Discord UNO",
			description: "To host a game press the `Create Game` button below!",
		}).setColor(
			["RED", "BLUE", "GREEN", "YELLOW"][Math.floor(Math.random() * 4)]
		),
		components: [
			{
				type: 1,
				components: [
					{
						type: 2,
						label: "Create Game",
						style: ButtonStyle.GREEN,
						custom_id: "creategame",
					},
				],
			},
		],
	};
};
