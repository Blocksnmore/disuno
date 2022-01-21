import { ButtonInteraction } from "interaction";
import { games, UnoGame, UnoGameState } from "game";
import {
	MessageComponentInteraction,
	Embed,
	InteractionResponseType,
} from "harmony";

export default class JoinInteraction extends ButtonInteraction {
	priorty = 2;

	async execute(i: MessageComponentInteraction) {
		if (i.guild == undefined) return;

		if (!games.has(i.guild.id)) {
			await i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						...UnoGame.embedTemplate,
						title: "Unable to complete action",
						description: "There is no game running on this server!",
					}).setColor("RED"),
				],
			});
			return false;
		}

		const game = games.get(i.guild.id)!;

		switch (i.customID) {
			case "start": {
				if (game.hostId != i.user.id) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Unable to start",
								description: "You are not the host of this game.",
							}).setColor("RED"),
						],
					});
				} else {
					if (game.players.length < 3) {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									...UnoGame.embedTemplate,
									title: "Unable to start",
									description: `You need at least 3 players to start! Needed: ${
										3 - game.players.length
									}`,
								}).setColor("RED"),
							],
						});
					} else {
						if (game.gameState != UnoGameState.LOBBY) {
							await i.reply({
								ephemeral: true,
								embeds: [
									new Embed({
										...UnoGame.embedTemplate,
										title: "Unable to start",
										description: "This game is currently in progress!",
									}).setColor("RED"),
								],
							});
						} else {
							await i.respond({
								flags: InteractionResponseType.DEFERRED_MESSAGE_UPDATE,
							});
							game.startGame();
						}
					}
				}
				return false;
			}

			case "join": {
				if (game.gameState != UnoGameState.LOBBY) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Unable to join",
								description:
									"This game is currently in progress! Please wait for it to finish",
							}).setColor("RED"),
						],
					});
				} else {
					if (game.isPlayerInGame(i.user.id)) {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									...UnoGame.embedTemplate,
									title: "Unable to join",
									description: "You are already in this game!",
								}).setColor("RED"),
							],
						});
					} else {
						game.addPlayer(i.user.id, i.user.tag);
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									...UnoGame.embedTemplate,
									title: "Joined game!",
									description: "You have joined the game",
								}).setColor("GREEN"),
							],
						});
					}
				}
				return false;
			}

			case "leave": {
				if (!game.isPlayerInGame(i.user.id)) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Unable to leave",
								description: "You are not in this game!",
							}).setColor("RED"),
						],
					});
				} else {
					game.onPlayerQuit(i.user.id);
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Left game!",
								description: "You have left the game",
							}).setColor("GREEN"),
						],
					});
				}
				return false;
			}

			case "cancel": {
				if (
					i.user.id == game.hostId ||
					i.member!.permissions.has("ADMINISTRATOR")
				) {
					game.stopGame(i.user.id == game.hostId);
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Canceled game!",
								description: "Game has been canceled",
							}).setColor("GREEN"),
						],
					});
				} else {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Unable to cancel",
								description: "You are not the host!",
							}).setColor("RED"),
						],
					});
				}
				return false;
			}
		}

		if (game.gameState != UnoGameState.PLAYING) return false;
	}
}
