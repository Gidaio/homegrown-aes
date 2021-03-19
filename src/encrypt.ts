import { multiplyBytes } from "./multiply"
import { S_BOX } from "./sBox"

type Word = [number, number, number, number]

const Nk = 4
const Nb = 4
const Nr = 10

export function encrypt(input: number[], key: number[]): number[] {
	let output = []
	for (let i = 0; i < input.length; i += 15) {
		output.push(...encryptBlock(padBlock(input.slice(i, i + 15)), key))
	}

	return output
}

export function padBlock(input: number[]): number[] {
	let output = [...input]
	output.push(0x80)
	while (output.length < 16) {
		output.push(0x00)
	}

	return output
}

export function encryptBlock(input: number[], key: number[]): number[] {
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

export function subBytes(state: number[]): void {
	state.forEach((byte, index) => {
		state[index] = S_BOX[byte]
	})
}

export function shiftRows(state: number[]): void {
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

export function mixColumns(state: number[]): void {
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

function expandKey(key: number[]): number[] {
	let w: Word[] = []

	for (let i = 0; i < Nk; i++) {
		w.push(key.slice(i * 4, i * 4 + 4) as Word)
	}

	for (let i = Nk; i < Nb * (Nr + 1); i++) {
		let temp = w[w.length - 1]
		if (i % Nk === 0) {
			temp = rotWord(temp)
			temp = subWord(temp)
			const rcon = rCon(i / Nk)
			temp = xorWords(temp, rcon)
		}

		w.push(xorWords(w[i - Nk], temp))
	}

	return w.flat()
}

function subWord(word: Word): Word {
	return word.map(byte => S_BOX[byte]) as Word
}

function rotWord(word: Word): Word {
	return [word[1], word[2], word[3], word[0]]
}

function xorWords(a: Word, b: Word): Word {
	return [
		a[0] ^ b[0],
		a[1] ^ b[1],
		a[2] ^ b[2],
		a[3] ^ b[3],
	]
}

function rCon(i: number): Word {
	let val = 1
	for (let j = 0; j < i - 1; j++) {
		val <<= 1
		if (val & 0x100) {
			val ^= 0x11b
		}
	}
	return [val, 0, 0, 0]
}
