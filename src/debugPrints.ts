type Word = [number, number, number, number]

export function blockToString(block: Word[]): string {
	return "\n" + block.map(wordToString).join("\n")
}

export function wordToString(word: Word): string {
	return word.map(byteToString).join(" ")
}

export function bufferToString(buffer: number[]): string {
	return buffer.map(byteToString).join("")
}

export function byteToString(byte: number): string {
	return byte.toString(16).padStart(2, "0")
}
