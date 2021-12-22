import {
	Embed,
	Extension,
	slash,
	event,
	ApplicationCommandsModule,
	ApplicationCommandInteraction,
	Interaction,
	isMessageComponentInteraction,
	InteractionResponseType,
} from "harmony";
import { UnoGame, getPanelEmbedAndButtons } from "uno";
import { decks, DeckType } from "deck";

/**
 * First argument is the guild id
 */
const games: Map<string, UnoGame> = new Map();

export default class Events extends Extension {
	name = "UnoEvents";

	@event()
	async ready() {
		const module = new Commands();
		module.commands = module.commands.map((cmd) => {
			this.client.interactions.handle({
				handler: cmd.handler,
				name: cmd.name,
			});
			return cmd;
		});
		if (
			(
				await this.client.interactions.commands.guild("688115766867918950")
			).array().length != 2
		) {
			this.client.interactions.commands.bulkEdit(
				[
					{
						name: "createpanel",
						description: "Create a panel for Discord UNO!",
					},
					{
						name: "deckinfo",
						description: "Get information about a deck.",
						options: [
							{
								name: "deck",
								type: "STRING",
								description: "Get information about said deck.",
								required: true,
								choices: decks.map((d) => ({ name: d.name, value: d.id })),
							},
						],
					},
				],
				"688115766867918950"
			);
		}
	}

	@event()
	async interactionCreate(_ext: this, i: Interaction) {
		if (!isMessageComponentInteraction(i)) return;
		if (i.guild == undefined || i.channel == undefined) return;
		switch (i.customID.toLowerCase()) {
			case "creategame": {
				if (games.has(i.guild.id)) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "A game is already in progress!",
								description:
									"Please wait for the current game to end before starting a new one.",
							}).setColor("RED"),
						],
					});
				} else {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Creating a game...",
								description:
									"Please select your deck from below. Use `/deckinfo <deck>` to learn more about a deck.",
							}).setColor("GREEN"),
						],
						components: [
							{
								type: 1,
								components: [
									{
										type: 2,
										label: "Classic",
										style: "BLURPLE",
										customID: "cg-classic",
									},
								],
							},
						],
					});
				}
				break;
			}

			case "cg-flip":
			case "cg-classic": {
				if (games.has(i.guild.id)) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to create game!",
								description:
									"This server already has a game in progress. Please wait for it to end.",
							}).setColor("RED"),
						],
					});
				} else {
					const deck = decks.find(
						(d) => d.id == i.customID.toLowerCase().substring(`cg-`.length)
					)!.id;

					let targetDeck: DeckType;

					switch (deck) {
						case "flip": {
							targetDeck = DeckType.Flip;
							break;
						}
						default: {
							targetDeck = DeckType.Classic;
						}
					}

					games.set(
						i.guild.id,
						new UnoGame(
							i.guild,
							i.channel,
							{
								name: i.user.username,
								id: i.user.id,
								user: i.user,
							},
							targetDeck
						)
					);

					const game = games.get(i.guild.id)!;

					game.players.push(i.user.id);

					const { embed, components } = game.getLobbyEmbedAndButton();

					const msg = await i.channel.send({
						components,
						embed,
					});

					game.message = msg;

					await i.respond({
						type: InteractionResponseType.DEFERRED_MESSAGE_UPDATE,
					});
				}
				break;
			}

			case "join": {
				if (games.has(i.guild.id)) {
					const game = games.get(i.guild.id)!;
					if (game.players.includes(i.user.id)) {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									title: "Unable to join game!",
									description: "You are already in the game!",
								}).setColor("RED"),
							],
						});
					} else {
						game.players.push(i.user.id);
						const { embed, components } = game.getLobbyEmbedAndButton();

						game.message?.edit({
							embeds: [embed],
							components,
						});

						i.reply({
							ephemeral: true,
							content: "You have joined the game!",
						});
					}
				} else {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to join game!",
								description: "There is no game in progress on this server.",
							}).setColor("RED"),
						],
					});
				}
				break;
			}

			case "start": {
				if (games.has(i.guild.id)) {
					const game = games.get(i.guild.id)!;
					if (game.creator.id != i.user.id) {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									title: "Unable to start game!",
									description: "You are not the game creator!",
								}).setColor("RED"),
							],
						});
					} else {
						if (game.players.length < 3) {
							await i.reply({
								ephemeral: true,
								embeds: [
									new Embed({
										title: "Unable to start game!",
										description: `You need 3 people to play! ${
											3 - game.players.length
										} more needed.`,
									}).setColor("RED"),
								],
							});
						} else {
							await i.reply({
								ephemeral: true,
								embeds: [
									new Embed({
										title: "Starting!",
										description: "Starting game!",
									}).setColor("GREEN"),
								],
							});
						}
					}
				} else {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to start game!",
								description: "There is no game in progress on this server.",
							}).setColor("RED"),
						],
					});
				}
			}
		}
	}
}

class Commands extends ApplicationCommandsModule {
	name = "UnoCommands";

	@slash()
	createpanel(i: ApplicationCommandInteraction) {
		if (i.member?.permissions.has("MANAGE_SERVER")) {
			const { embed, components } = getPanelEmbedAndButtons();

			const _message = i.reply({
				embeds: [embed],
				components,
			});

			// TODO: Pin the message when bug fixed
		} else {
			i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Missing permission!",
						description:
							"You need the `MANAGE_SERVER` permission to create a game.",
					}).setColor("RED"),
				],
			});
		}
	}

	@slash()
	deckinfo(i: ApplicationCommandInteraction) {
		const selection = i.option("deck");
		if (selection == undefined) {
			i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Missing argument!",
						description: "You need to specify a deck to get information about.",
					}).setColor("RED"),
				],
			});
		} else {
			const deck = decks.find((d) => d.id == selection)!;
			i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Deck Information",
						fields: [
							{
								name: deck.name,
								value: deck.description,
							},
						],
						footer: {
							text: `Cards: ${deck.cards}`,
						},
					}).setColor(
						["RED", "GREEN", "BLUE", "YELLOW"][Math.floor(Math.random() * 4)]
					),
				],
			});
		}
	}
}
