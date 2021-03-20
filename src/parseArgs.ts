interface Options {
	mode: "encrypt" | "decrypt"
	input: { file: string } | { raw: string }
	output: { file: string } | { stdout: true }
	key: { file: string } | { raw: string }
}

export default function parseArgs(): Options {
	const options: Partial<Options> = {
		output: { stdout: true }
	}
	let currentOption: string | null = null
	for (let arg of process.argv.slice(2)) {
		if (currentOption) {
			switch (currentOption) {
				case "--inputFile":
				case "-i":
					options.input = { file: arg }
					break

				case "--inputRaw":
				case "-ir":
					options.input = { raw: arg }
					break

				case "--keyFile":
				case "-k":
					options.key = { file: arg }
					break

				case "--keyRaw":
				case "-kr":
					options.key = { raw: arg }
					break

				case "--outputFile":
				case "-o":
					options.output = { file: arg }
					break
			}
			currentOption = null
		} else {
			switch (arg) {
				case "--encrypt":
				case "-e":
					if (options.mode) {
						throw new Error(`Mode ${options.mode} already specified.`)
					}
					options.mode = "encrypt"
					break

				case "--decrypt":
				case "-d":
					if (options.mode) {
						throw new Error(`Mode ${options.mode} already specified.`)
					}
					options.mode = "decrypt"
					break

				case "--inputFile":
				case "-i":
					if (options.input) {
						throw new Error("Input already specified.")
					}
					currentOption = arg
					break

				case "--inputRaw":
				case "-ir":
					if (options.input) {
						throw new Error("Input already specified.")
					}
					currentOption = arg
					break

				case "--keyFile":
				case "-k":
					if (options.key) {
						throw new Error("Key already specified.")
					}
					currentOption = arg
					break

				case "--keyRaw":
				case "-kr":
					if (options.key) {
						throw new Error("Key already specified.")
					}
					currentOption = arg
					break

				case "--outputFile":
				case "-o":
					if ("file" in options.output!) {
						throw new Error("Output already specified.")
					}
					currentOption = arg
					break

				default:
					throw new Error(`Unrecognized argument ${arg}.`)
			}
		}
	}

	if (!options.mode) { throw new Error("Missing mode.") }
	if (!options.input) { throw new Error("Missing input.") }
	if (!options.key) { throw new Error("Missing key.") }
	if (!options.output) { throw new Error("Missing output.") }

	return options as Options
}
