export function multiplyBytes(a: number, b: number): number {
	let result = 0x00

	while (a > 0 && b > 0) {
		if (b & 0x01) {
			result ^= a
		}
		a <<= 1
		b >>= 1
		if (a & 0x100) {
			a ^= 0x11b
		}
	}

	return result
}
