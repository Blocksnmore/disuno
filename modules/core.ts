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
	MessageComponentPayload,
	ButtonStyle,
} from "harmony";
import { UnoGame, getPanelEmbedAndButtons } from "uno";
import { decks, DeckType } from "deck";
import { CardColor } from "cards";

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
			// Creation
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
								footer: {
									text: "This prompt will expire in 30 seconds!",
								},
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

					const [res] = await i.client.waitFor(
						"interactionCreate",
						(e) =>
							isMessageComponentInteraction(e) &&
							e.customID.startsWith("cg-") &&
							e.user.id == i.user.id,
						30 * 1000
					);

					if (res == undefined) {
						return i.editResponse({
							embeds: [
								new Embed({
									title: "Game creation canceled!",
									description: "Creation has been canceled due to inactivity.",
								}).setColor("RED"),
							],
							components: [],
						});
					} else {
						if (!isMessageComponentInteraction(res)) return;
						const deck = DeckType.Classic; // Will be fetched soon:tm:
						if (games.has(i.guild.id)) {
							return await res.message.edit({
								embeds: [
									new Embed({
										title: "Unable to create game!",
										description:
											"This server already has a game in progress. Please wait for it to end.",
									}).setColor("RED"),
								],
							});
						} else {
							games.set(
								i.guild.id,
								new UnoGame(
									{
										name: i.user.username,
										id: i.user.id,
										user: i.user,
									},
									i.client,
									deck
								)
							);

							const game = games.get(i.guild.id)!;

							const { embed, components } = game.getLobbyEmbedAndButton();

							game.message = await i.message.edit({
								components,
								embed,
							});

							// TODO (When done with bot): Add the ability to add rules like 7-0, etc
							i.editResponse({
								embeds: [
									new Embed({
										title: "Game created!",
										description: "The game has been created!",
									}).setColor("GREEN"),
								],
								components: [],
							});
						}
					}
				}
				break;
			}

			case "join": {
				if (games.has(i.guild.id)) {
					const game = games.get(i.guild.id)!;
					for (const player of game.players) {
						if (player.id == i.user.id) {
							return await i.reply({
								ephemeral: true,
								embeds: [
									new Embed({
										title: "Unable to join game!",
										description: "You are already in the game!",
									}).setColor("RED"),
								],
							});
						}
						continue;
					}

					game.addPlayer(i.user.id, i.user.username);
					const { embed, components } = game.getLobbyEmbedAndButton();

					game.message!.edit({
						embeds: [embed],
						components,
					});

					i.reply({
						ephemeral: true,
						content: "You have joined the game!",
					});
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
						if (game.players.length < 3 && i.user.id != "314166178144583682") {
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
							await i.respond({
								type: InteractionResponseType.DEFERRED_MESSAGE_UPDATE
							})

							await game.message!.edit({
								embeds: [
									new Embed({
										title: "Starting game!",
										description: "Shuffling the deck...",
									}).setColor("GREEN"),
								],
								components: [],
							});

							setTimeout(
								() => game.onGameStart(),
								Math.floor(Math.random() * 1000) + 1000
							);
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
				break;
			}

			case "cancel": {
				if (games.has(i.guild.id)) {
					const game = games.get(i.guild.id)!;
					if (
						game.creator.id != i.user.id &&
						!i.member?.permissions.has("ADMINISTRATOR")
					) {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									title: "Unable to cancel game!",
									description:
										"You are not the game creator nor an Administrator!",
								}).setColor("RED"),
							],
						});
					} else {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									title: "Cancelling!",
									description: "Cancelling game!",
								}).setColor("GREEN"),
							],
						});

						const { embed, components } = getPanelEmbedAndButtons();

						game.message!.edit({
							embeds: [
								embed.setFooter(
									`Previous game has been canceled by ${
										game.creator.id == i.user.id
											? "the Host"
											: "an Administrator"
									}!`
								),
							],
							components,
						});

						games.delete(i.guild.id);
					}
				} else {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to cancel game!",
								description: "There is no game on this server.",
							}).setColor("RED"),
						],
					});
				}
				break;
			}

			// Respond so button doesn't show the interaction failed
			case "blank": {
				await i.respond({
					flags: InteractionResponseType.DEFERRED_MESSAGE_UPDATE,
				});
				break;
			}
		}

		// Gameplay
		const game = games.get(i.guild.id);
		if (game == undefined || game.started == false) return;
		switch (i.customID.toLowerCase()) {
			case "play": {
				if (game.getCurrentPlayer().id != i.user.id) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to play!",
								description: "It is not your turn!",
							}).setColor("RED"),
						],
					});
				} else {
					return;
				}
				break;
			}

			case "view": {
				console.log("a")
				game.showPlayerCards(i);
				break;
			}
		}

		// Viewing cards
		switch (i.customID.toUpperCase()) {
			// TODO: Make this work
			case CardColor.RED: {
				const cards = game
					.getPlayer(i.user.id)!
					.cards.filter((c) => c.color == CardColor.RED);
				if (cards.length == 0) {
					await i.editResponse({
						embeds: [
							new Embed({
								title: "No cards!",
								description: "You have no cards for this color!",
							}).setColor("RED"),
						],
						components: [],
					});
				} else {
					const isCurrentPlayer = game.getCurrentPlayer().id == i.user.id;
					const buttonRows: MessageComponentPayload[][] = [[]];
					const cardCounts: { [key: string]: number } = {};
					let index = 0;

					for (const card of cards) {
						cardCounts[card.type] = (cardCounts[card.type] ?? 0) + 1;
					}

					for (const cardType in cardCounts) {
						const cardCount = cardCounts[cardType];
						if (buttonRows[index].length > 4) {
							// No way there's going to be 5 rows
							index++;
							buttonRows[index] = [];
						}
						buttonRows[index].push({
							type: 2,
							label: `${game.formatCardString(cardType)}${
								cardCount > 1 ? ` x${cardCount}` : ""
							}`,
							custom_id: isCurrentPlayer ? "blank" : `r-${cardType}`,
							style: ButtonStyle.RED,
						});
					}

					await i.editResponse({
						embeds: [
							new Embed({
								title: "Red cards",
								description: "You have the following cards:",
							}).setColor("RED"),
						],
						components: buttonRows.map((row) => ({
							type: 1,
							components: row,
						})),
					});
				}
			}
		}
	}
}

class Commands extends ApplicationCommandsModule {
	name = "UnoCommands";

	@slash()
	async createpanel(i: ApplicationCommandInteraction) {
		if (i.member == undefined || i.channel == undefined) return;
		if (i.member.permissions.has("MANAGE_SERVER")) {
			const { embed, components } = getPanelEmbedAndButtons();

			const { message } = await i.reply({
				embeds: [embed],
				components,
			});

			i.channel.pinMessage(message!.id);
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
							text: `Cards: ${
								deck.cards.amount < 0
									? "Unknown (Deck coming soon)"
									: deck.cards.amount
							}`,
						},
					}).setColor(
						["RED", "GREEN", "BLUE", "YELLOW"][Math.floor(Math.random() * 4)]
					),
				],
			});
		}
	}
}
