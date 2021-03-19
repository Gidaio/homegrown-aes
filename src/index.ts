import { bufferToString } from "./debugPrints"
import { decrypt } from "./decrypt"
import { encrypt } from "./encrypt"

import { readFileSync, writeFileSync } from "fs"

const input = Array.from(readFileSync("testInput"))
const key = Array.from(readFileSync("testKey"))

console.log(`Start:\n${bufferToString(input)}\n`)
const encrypted = encrypt(input, key)
console.log(`Encrypted:\n${bufferToString(encrypted)}\n`)
const decrypted = decrypt(encrypted, key)
console.log(`End:\n${bufferToString(decrypted)}`)

writeFileSync("testOutput", Buffer.from(decrypted))
