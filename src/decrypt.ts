import { multiplyBytes } from "./multiply"
import { XOB_S } from "./sBox"

type Word = [number, number, number, number]

const Nk = 4
const Nb = 4
const Nr = 10

export function decrypt(input: number[], key: number[]): number[] {
	let output = []
	for (let i = 0; i < input.length; i += 16) {
		// output.push(...depadBlock(decryptBlock(input.slice(i, i + 16), key)))
		output.push(...depadBlock(input.slice(i, i + 16)))
	}

	return output
}

export function depadBlock(input: number[]): number[] {
	console.debug(`Input: ${input.map(byte => byte.toString(16).padStart(2, "0")).join("")}`)
	let output = [...input]
	while (output[output.length - 1] === 0x00) {
		output.pop()
	}
	output.pop()
	console.debug(`Output: ${output.map(byte => byte.toString(16).padStart(2, "0")).join("")}`)

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

	// console.log(`input:\n    ${blockToString(state)}`)
	addRoundKey(Nr)
	// console.log(`round key value:\n    ${blockToString(w.slice(0, Nb))}`)

	for (let round = Nr - 1; round > 0; round--) {
		// console.log(`round ${round}:`)
		// console.log(`  input:\n    ${blockToString(state)}`)
		unshiftRows()
		// console.log(`  after shiftRows:\n    ${blockToString(state)}`)
		unsubBytes()
		// console.log(`  after subBytes:\n    ${blockToString(state)}`)
		// console.log(`  round key value:\n    ${blockToString(w.slice(round * Nb, round * Nb + Nb))}`)
		addRoundKey(round)
		unmixColumns()
		// console.log(`  after mixColumns:\n    ${blockToString(state)}`)
	}

	// console.log(`round: 10`)
	// console.log(`  input:\n    ${blockToString(state)}`)
	unshiftRows()
	// console.log(`  after shiftRows:\n    ${blockToString(state)}`)
	unsubBytes()
	// console.log(`  after subBytes:\n    ${blockToString(state)}`)
	// console.log(`  round key value:\n    ${blockToString(w.slice(10 * Nb, 11 * Nb))}`)
	addRoundKey(Nr)

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

	function unsubBytes(): void {
		state = state.map(unsubWord)
	}

	function unshiftRows(): void {
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

	function unmixColumns(): void {
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
			temp = unsubWord(temp)
			// console.log(`      after subWord: ${wordToString(temp)}`)
			const rcon = rCon(i / Nk)
			// console.log(`      rCon: ${wordToString(rcon)}`)
			temp = xorWords(temp, rcon)
		}

		w.push(xorWords(w[i - Nk], temp))
	}

	return w
}

function unsubWord(word: Word): Word {
	return word.map(byte => XOB_S[byte]) as Word
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

function blockToString(block: Word[]): string {
	return block.map(word => wordToString(word)).join("\n")
}

function wordToString(word: Word): string {
	return word.map(byte => byte.toString(16).padStart(2, "0")).join("")
}
