import decrypt from "./decrypt"
import encrypt from "./encrypt"

import { readFileSync, writeFileSync } from "fs"

const input = Array.from(readFileSync("testInput"))
const key = Array.from(readFileSync("testKey"))

const encrypted = encrypt(input, key)
const decrypted = decrypt(encrypted, key)

writeFileSync("testOutput", Buffer.from(decrypted))
