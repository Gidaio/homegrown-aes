import { S_BOX } from "./sBox"

const Nk = 4
const Nb = 4
const Nr = 10

export function expandKey(key: number[]): number[] {
	let w: number[] = [...key]

	for (let i = Nk; i < Nb * (Nr + 1); i++) {
		if (i % Nk === 0) {
			w.push(
				w[(i - Nk) * 4] ^ S_BOX[w[w.length - 3]] ^ rCon(i / Nk),
				w[(i - Nk) * 4 + 1] ^ S_BOX[w[w.length - 2]],
				w[(i - Nk) * 4 + 2] ^ S_BOX[w[w.length - 1]],
				w[(i - Nk) * 4 + 3] ^ S_BOX[w[w.length - 4]],
			)
		} else {
			w.push(
				w[(i - Nk) * 4] ^ w[w.length - 4],
				w[(i - Nk) * 4 + 1] ^ w[w.length - 3],
				w[(i - Nk) * 4 + 2] ^ w[w.length - 2],
				w[(i - Nk) * 4 + 3] ^ w[w.length - 1],
			)
		}
	}

	return w
}

function rCon(i: number): number {
	let val = 1
	for (let j = 0; j < i - 1; j++) {
		val <<= 1
		if (val & 0x100) {
			val ^= 0x11b
		}
	}
	return val
}
