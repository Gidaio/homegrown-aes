import { multiplyBytes } from "./multiply"
import { S_BOX } from "./sBox"

type Word = [number, number, number, number]

const Nk = 4
const Nb = 4
const Nr = 10

export function encrypt(input: number[], key: number[]): number[] {
	let output = []
	for (let i = 0; i < input.length; i += 15) {
		// output.push(...encryptBlock(padBlock(input.slice(i, i + 15)), key))
		output.push(...padBlock(input.slice(i, i + 15)))
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

	// console.log(`input:\n    ${blockToString(state)}`)
	addRoundKey(0)
	// console.log(`round key value:\n    ${blockToString(w.slice(0, Nb))}`)

	for (let round = 1; round < Nr; round++) {
		// console.log(`round ${round}:`)
		// console.log(`  input:\n    ${blockToString(state)}`)
		subBytes()
		// console.log(`  after subBytes:\n    ${blockToString(state)}`)
		shiftRows()
		// console.log(`  after shiftRows:\n    ${blockToString(state)}`)
		mixColumns()
		// console.log(`  after mixColumns:\n    ${blockToString(state)}`)
		// console.log(`  round key value:\n    ${blockToString(w.slice(round * Nb, round * Nb + Nb))}`)
		addRoundKey(round)
	}

	// console.log(`round: 10`)
	// console.log(`  input:\n    ${blockToString(state)}`)
	subBytes()
	// console.log(`  after subBytes:\n    ${blockToString(state)}`)
	shiftRows()
	// console.log(`  after shiftRows:\n    ${blockToString(state)}`)
	// console.log(`  round key value:\n    ${blockToString(w.slice(10 * Nb, 11 * Nb))}`)
	addRoundKey(10)

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

	function subBytes(): void {
		state = state.map(subWord)
	}

	function shiftRows(): void {
		for (let row = 1; row < 4; row++) {
			const shift = row
			const temp = new Array(Nb)
			for (let i = 0; i < Nb; i++) {
				temp[i] = state[(i + shift) % Nb][row]
			}

			for (let i = 0; i < Nb; i++) {
				state[i][row] = temp[i]
			}
		}
	}

	function mixColumns(): void {
		for (let column = 0; column < Nb; column++) {
			const newColumn = new Array(4)
			const multipliers = new Array(Nb).fill(0x01)
			multipliers[0] = 0x02
			multipliers[1] = 0x03
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
}

function expandKey(key: number[]): Word[] {
	let w: Word[] = []

	for (let i = 0; i < Nk; i++) {
		w.push(key.slice(i * 4, i * 4 + 4) as Word)
	}

	// console.log(JSON.stringify(w.map(word => word.map(byte => byte.toString(16)))))

	for (let i = Nk; i < Nb * (Nr + 1); i++) {
		let temp = w[w.length - 1]
		// console.log(`i: ${i.toString(10).padStart(2, " ")} temp: ${wordToString(temp)}`)
		if (i % Nk === 0) {
			temp = rotWord(temp)
			// console.log(`      after rotWord: ${wordToString(temp)}`)
			temp = subWord(temp)
			// console.log(`      after subWord: ${wordToString(temp)}`)
			const rcon = rCon(i / Nk)
			// console.log(`      rCon: ${wordToString(rcon)}`)
			temp = xorWords(temp, rcon)
		}

		w.push(xorWords(w[i - Nk], temp))
	}

	return w
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
