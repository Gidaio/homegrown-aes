import { multiplyBytes } from "./multiply"
import { S_BOX, XOB_S } from "./sBox"

type Word = [number, number, number, number]

const Nk = 4
const Nb = 4
const Nr = 10

export function decrypt(input: number[], key: number[]): number[] {
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
	let state: Word[] = [
		[0x00, 0x00, 0x00, 0x00],
		[0x00, 0x00, 0x00, 0x00],
		[0x00, 0x00, 0x00, 0x00],
		[0x00, 0x00, 0x00, 0x00],
	]

	let w = expandKey(key)

	for (let column = 0; column < Nb; column++) {
		for (let row = 0; row < 4; row++) {
			state[column][row] = input[row + 4 * column]
		}
	}

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

	const out = new Array(16)
	for (let column = 0; column < Nb; column++) {
		for (let row = 0; row < 4; row++) {
			out[row + 4 * column] = state[column][row]
		}
	}

	return out

	function addRoundKey(round: number) {
		for (let i = 0; i < state.length; i++) {
			state[i] = xorWords(state[i], w[round * Nb + i])
		}
	}
}

export function unshiftRows(state: Word[]): void {
	for (let row = 1; row < 4; row++) {
		const shift = 4 - row
		const temp = new Array(Nb)
		for (let i = 0; i < Nb; i++) {
			temp[i] = state[(i + shift) % Nb][row]
		}

		for (let i = 0; i < Nb; i++) {
			state[i][row] = temp[i]
		}
	}
}

export function unsubBytes(state: Word[]): void {
	state.forEach((word, index) => {
		state[index] = unsubWord(word)
	})
}

export function unmixColumns(state: Word[]): void {
	for (let column = 0; column < Nb; column++) {
		const newColumn = new Array(4)
		const multipliers = new Array(Nb).fill(0x01)
		multipliers[0] = 0x0e
		multipliers[1] = 0x0b
		multipliers[2] = 0x0d
		multipliers[3] = 0x09
		for (let row = 0; row < 4; row++) {
			newColumn[row] = state[column]
				.map((val, index) => multiplyBytes(val, multipliers[index]))
				.reduce((sum, val) => sum ^ val)
			multipliers.unshift(multipliers.pop())
		}
		for (let row = 0; row < 4; row++) {
			state[column][row] = newColumn[row]
		}
	}
}

function expandKey(key: number[]): Word[] {
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

	return w
}

function unsubWord(word: Word): Word {
	return word.map(byte => XOB_S[byte]) as Word
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
