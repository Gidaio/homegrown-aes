import decrypt from "./decrypt"
import encrypt from "./encrypt"
import parseArgs from "./parseArgs"

import { readFileSync, writeFileSync } from "fs"

const options = parseArgs()

const input = "file" in options.input
	? Array.from(readFileSync(options.input.file))
	: Array.from(Buffer.from(options.input.raw))
const key = "file" in options.key
	? Array.from(readFileSync(options.key.file))
	: Array.from(Buffer.from(options.key.raw))

if (key.length !== 16) {
	throw new Error("Inappropriate length key.")
}

let output

if (options.mode === "encrypt") {
	output = encrypt(input, key)
} else {
	output = decrypt(input, key)
}

if ("file" in options.output) {
	writeFileSync(options.output.file, Buffer.from(output))
} else {
	console.info(Buffer.from(output).toString("ascii"))
}
