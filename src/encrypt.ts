import { expandKey } from "./expandKey"
import { multiplyBytes } from "./multiply"
import { S_BOX } from "./sBox"

const Nb = 4
const Nr = 10

export default function encrypt(input: number[], key: number[]): number[] {
	let output = []
	for (let i = 0; i < input.length; i += 15) {
		output.push(...encryptBlock(padBlock(input.slice(i, i + 15)), key))
	}

	return output
}

function padBlock(input: number[]): number[] {
	let output = [...input]
	output.push(0x80)
	while (output.length < 16) {
		output.push(0x00)
	}

	return output
}

function encryptBlock(input: number[], key: number[]): number[] {
	let state: number[] = [...input]

	let w = expandKey(key)

	addRoundKey(0)

	for (let round = 1; round < Nr; round++) {
		subBytes(state)
		shiftRows(state)
		mixColumns(state)
		addRoundKey(round)
	}

	subBytes(state)
	shiftRows(state)
	addRoundKey(Nr)

	return state

	function addRoundKey(round: number) {
		for (let i = 0; i < state.length; i++) {
			state[i] ^= w[round * Nb * 4 + i]
		}
	}
}

function subBytes(state: number[]): void {
	state.forEach((byte, index) => {
		state[index] = S_BOX[byte]
	})
}

function shiftRows(state: number[]): void {
	for (let row = 1; row < 4; row++) {
		const shift = row
		const temp = new Array(Nb)
		for (let i = 0; i < Nb; i++) {
			temp[i] = state[((i + shift) % Nb) * 4 + row]
		}

		for (let i = 0; i < Nb; i++) {
			state[i * 4 + row] = temp[i]
		}
	}
}

function mixColumns(state: number[]): void {
	for (let column = 0; column < Nb; column++) {
		const newColumn = new Array(4)
		const multipliers = new Array(Nb).fill(0x01)
		multipliers[0] = 0x02
		multipliers[1] = 0x03
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
