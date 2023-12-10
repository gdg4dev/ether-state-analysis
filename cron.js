const axios = require("axios");
const fs = require("fs");
const moment = require("moment");

const  updateDataToDate = async () => {
const queue_endpoint = `https://beaconcha.in/api/v1/validators/queue?apikey=${process.env.API_KEY}`;
const epoch_endpoint = `https://mainnet.beaconcha.in/api/v1/epoch/finalized`;
const apr_endpoint = `https://beaconcha.in/api/v1/ethstore/latest?apikey=${process.env.API_KEY}`;
const supply_endpoint = `https://ultrasound.money/api/v2/fees/supply-over-time`;

let queue_data, epoch_data, apr_data, supply_data;

return await axios
	.all([
		axios.get(queue_endpoint),
		axios.get(epoch_endpoint),
		axios.get(apr_endpoint),
		axios.get(supply_endpoint),
	])
	.then(
		axios.spread((queueRes, epochRes, aprRes, supplyRes) => {
			queue_data = queueRes.data.data;
			epoch_data = epochRes.data.data;
			apr_data = aprRes.data.data;
			supply_data = supplyRes.data;

			function calculateWaitTime(activeValidators, queue) {
				const scaling = [
					0, 327680, 393216, 458752, 524288, 589824, 655360, 720896,
					786432, 851968, 917504, 983040, 1048576, 1114112, 1179648,
					1245184, 1310720, 1376256, 1441792, 1507328, 1572864,
					1638400, 1703936, 1769472, 1835008, 1900544, 1966080,
					2031616, 2097152, 2162688, 2228224, 2293760, 2359296,
					2424832, 2490368, 2555904, 2621440, 2686976, 2752512,
				];
				const epochChurn = [
					4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
					20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
					35, 36, 37, 38, 39, 40, 41, 42,
				];
				const dayChurn = [
					1000, 1125, 1350, 1575, 1800, 2025, 2250, 2475, 2700, 2925,
					3150, 3375, 3600, 3825, 4050, 4275, 4500, 4725, 4950, 5175,
					5400, 5625, 5850, 6075, 6300, 6525, 6750, 6975, 7200, 7425,
					7650, 7875, 8100, 8325, 8550, 8775, 9000, 9225, 9450,
				];

				let currentChurn = 9;
				let churnTimeDays = 0;
				let churnFactor = 0;

				for (let i = 0; i < scaling.length; i++) {
					if (activeValidators > scaling[i]) {
						currentChurn = epochChurn[i];
					}
					if (
						i < scaling.length - 1 &&
						activeValidators >= scaling[i] &&
						activeValidators < scaling[i + 1]
					) {
						let j = i;
						let queueRemaining = queue;
						while (queueRemaining > 0) {
							if (i === j) {
								if (
									activeValidators + queueRemaining <
									scaling[j + 1]
								) {
									churnTimeDays +=
										queueRemaining / dayChurn[j];
									churnFactor +=
										queueRemaining * epochChurn[j];
									queueRemaining = 0;
								} else {
									churnTimeDays +=
										(scaling[j + 1] - activeValidators) /
										dayChurn[j];
									churnFactor +=
										(scaling[j + 1] - activeValidators) *
										epochChurn[j];
									queueRemaining -=
										scaling[j + 1] - activeValidators;
								}
							} else if (
								scaling[j] + queueRemaining <
								scaling[j + 1]
							) {
								churnTimeDays += queueRemaining / dayChurn[j];
								churnFactor += queueRemaining * epochChurn[j];
								queueRemaining = 0;
							} else {
								churnTimeDays +=
									(scaling[j + 1] - scaling[j]) / dayChurn[j];
								churnFactor +=
									(scaling[j + 1] - scaling[j]) *
									epochChurn[j];
								queueRemaining -= scaling[j + 1] - scaling[j];
							}

							j += 1;
						}
					}
				}

				const aveChurn =
					queue > 0
						? Math.round((churnFactor / queue) * 100) / 100
						: currentChurn;

				const waitingTimeSeconds = Math.round(churnTimeDays * 86400);
				const waitingTimeMonths = Math.floor(
					waitingTimeSeconds / 2592000
				);
				const waitingTimeMonthsDays = Math.round(
					((waitingTimeSeconds % 2592000) / 2592000) * 30
				);
				const waitingTimeDays = Math.floor(waitingTimeSeconds / 86400);
				const waitingTimeDaysHours = Math.round(
					((waitingTimeSeconds % 86400) / 86400) * 24
				);
				const waitingTimeHours = Math.floor(waitingTimeSeconds / 3600);
				const waitingTimeHoursMinutes = Math.round(
					((waitingTimeSeconds % 3600) / 3600) * 60
				);
				const waitingTimeDaysRaw = waitingTimeSeconds / 86400;

				const formattedWaitTime =
					waitingTimeDays > 0
						? `${waitingTimeDays} ${
								waitingTimeDays === 1 ? "day" : "days"
						  }, ${waitingTimeDaysHours} ${
								waitingTimeDaysHours === 1 ? "hour" : "hours"
						  }`
						: waitingTimeHours > 0
						? `${waitingTimeHours} ${
								waitingTimeHours === 1 ? "hour" : "hours"
						  }, ${waitingTimeHoursMinutes} ${
								waitingTimeHoursMinutes === 1
									? "minute"
									: "minutes"
						  }`
						: `${waitingTimeHoursMinutes} ${
								waitingTimeHoursMinutes === 1
									? "minute"
									: "minutes"
						  }`;

				console.log("\nChurn Time Days:", churnTimeDays);
				console.log("\nCurrent Churn:", currentChurn);
				console.log("\nAverage Churn:", aveChurn);

				return {
					waitingTime: formattedWaitTime,
					waitingTimeDays: waitingTimeDaysRaw,
					currentChurn,
					churn: aveChurn,
					churnTimeDays,
				};
			}
			function estimateEntryWaitingTime() {
				const beaconEntering = queue_data["beaconchain_entering"];
				const activeValidators = queue_data["validatorscount"];
				const { waitingTime, waitingTimeDays, currentChurn, churn } =
					calculateWaitTime(activeValidators, beaconEntering);
				return {
					waitingTime,
					waitingTimeDays,
					beaconEntering,
					activeValidators,
					currentChurn,
					churn,
				};
			}
			function networkData() {
				const ethSupply = Math.round(supply_data.d1[0].supply);
				console.log("\neth_supply:\n\t" + ethSupply);

				const amountEthStaked = Math.round(
					epoch_data.votedether / 1000000000
				);
				console.log("\namount_eth_staked:\n\t" + amountEthStaked);

				const percentEthStaked =
					Math.round((amountEthStaked / ethSupply) * 10000) / 100;
				console.log("\npercent_eth_staked:\n\t" + percentEthStaked);

				const stakingApr = Math.round(apr_data.avgapr7d * 10000) / 100;
				console.log("\nstaking_apr:\n\t" + stakingApr);

				return {
					ethSupply,
					amountEthStaked,
					percentEthStaked,
					stakingApr,
				};
			}

			function estimateExitWaitingTime() {
				const beacon_exiting = queue_data["beaconchain_exiting"];
				const activeValidators = queue_data["validatorscount"];
				const { waitingTime, waitingTimeDays, churn } =
					calculateWaitTime(activeValidators, beacon_exiting);
				return { waitingTime, waitingTimeDays, beacon_exiting, churn };
			}
			const updateHistoricalData = () => {
				fs.readFile("historicalData.json", "utf8", (err, data) => {
					if (err) {
						console.error(err);
						return;
					}
					let allData = JSON.parse(data);
					let date = moment().utc().format("YYYY-MM-DD");
					let todaysData = {
						date: date,
						validators: activeValidators,
						entry_queue: beaconEntering,
						entry_wait:
							Math.round(entry_waiting_time_days * 100) / 100,
						exit_queue: beaconExiting,
						exit_wait:
							Math.round(exit_waiting_time_days * 100) / 100,
						churn: currentChurn,
						entry_churn: entry_churn,
						exit_churn: exit_churn,
						supply: ethSupply,
						staked_amount: amountEthStaked,
						staked_percent: percentEthStaked,
						apr: stakingApr,
					};
					console.log("\ntodays_data: \n\t", todaysData);
					if (
						allData.length > 0 &&
						allData[allData.length - 1].date
					) {
						if (date !== allData[allData.length - 1].date) {
							allData.push(todaysData);
							fs.writeFile(
								"historicalData.json",
								JSON.stringify(allData, null, 2),
								(err) => {
									if (err) {
										console.error(err);
										return;
									}
									console.log(
										"historical data has been updated"
									);
								}
							);
						} else {
							console.log(
								"historical data for the current date was already recorded"
							);
						}
					}
				});
			};

			// Estimate entry waiting time
			const {
				waitingTime: entry_waiting_time,
				waitingTimeDays: entry_waiting_time_days,
				beaconEntering,
				activeValidators,
				currentChurn,
				churn: entry_churn,
			} = estimateEntryWaitingTime();

			console.log(
				"\nEntry Waiting Time:",
				entry_waiting_time,
				"days:",
				entry_waiting_time_days,
				"Beacon Entering:",
				beaconEntering,
				"Active Validators:",
				activeValidators,
				"Current Churn:",
				currentChurn,
				"Entry Churn:",
				entry_churn
			);

			// Estimate exit waiting time
			const {
				waitingTime: exit_waiting_time,
				waitingTimeDays: exit_waiting_time_days,
				beaconExiting,
				churn: exit_churn,
			} = estimateExitWaitingTime();

			console.log(
				"\nExit Waiting Time:",
				exit_waiting_time,
				"days:",
				exit_waiting_time_days,
				"Beacon Exiting:",
				beaconExiting,
				"Exit Churn:",
				exit_churn
			);

			// Get network data
			const { ethSupply, amountEthStaked, percentEthStaked, stakingApr } =
				networkData();

			console.log(
				"\nEth Supply:",
				ethSupply,
				"Amount Eth Staked:",
				amountEthStaked,
				"Percent Eth Staked:",
				percentEthStaked,
				"Staking APR:",
				stakingApr
			);

			// Update historical data
			updateHistoricalData();
		})
	)
	.catch((error) => {
		console.error(error);
	});
}

module.exports = {updateDataToDate}