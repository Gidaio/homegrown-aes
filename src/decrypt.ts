import { expandKey } from "./expandKey"
import { multiplyBytes } from "./multiply"
import { XOB_S } from "./sBox"

const Nb = 4
const Nr = 10

export default function decrypt(input: number[], key: number[]): number[] {
	let output = []
	for (let i = 0; i < input.length; i += 16) {
		output.push(...unpadBlock(decryptBlock(input.slice(i, i + 16), key)))
	}

	return output
}

export function unpadBlock(input: number[]): number[] {
	let output = [...input]
	while (output[output.length - 1] === 0x00) {
		output.pop()
	}
	output.pop()

	return output
}

export function decryptBlock(input: number[], key: number[]): number[] {
	let state: number[] = [...input]

	let w = expandKey(key)

	addRoundKey(Nr)
	unshiftRows(state)
	unsubBytes(state)

	for (let round = Nr - 1; round > 0; round--) {
		addRoundKey(round)
		unmixColumns(state)
		unshiftRows(state)
		unsubBytes(state)
	}

	addRoundKey(0)

	return state

	function addRoundKey(round: number) {
		for (let i = 0; i < state.length; i++) {
			state[i] ^= w[round * Nb * 4 + i]
		}
	}
}

function unshiftRows(state: number[]): void {
	for (let row = 1; row < 4; row++) {
		const shift = 4 - row
		const temp = new Array(Nb)
		for (let i = 0; i < Nb; i++) {
			temp[i] = state[((i + shift) % Nb) * 4 + row]
		}

		for (let i = 0; i < Nb; i++) {
			state[i * 4 + row] = temp[i]
		}
	}
}

function unsubBytes(state: number[]): void {
	state.forEach((byte, index) => {
		state[index] = XOB_S[byte]
	})
}

function unmixColumns(state: number[]): void {
	for (let column = 0; column < Nb; column++) {
		const newColumn = new Array(4)
		const multipliers = new Array(Nb).fill(0x01)
		multipliers[0] = 0x0e
		multipliers[1] = 0x0b
		multipliers[2] = 0x0d
		multipliers[3] = 0x09
		for (let row = 0; row < 4; row++) {
			newColumn[row] = state.slice(column * 4, column * 4 + 4)
				.map((val, index) => multiplyBytes(val, multipliers[index]))
				.reduce((sum, val) => sum ^ val)
			multipliers.unshift(multipliers.pop())
		}
		for (let row = 0; row < 4; row++) {
			state[column * 4 + row] = newColumn[row]
		}
	}
}
