// Name: Decode Base64
// Description: Decode a base64 string and copy it to the clipboard
// Author: ElTacitos

import "@johnlindquist/kit"

let base64 = await arg("Enter base64 string to decode")
let decoded = atob(base64)

await clipboard.writeText(decoded)
await div(md(`
# ${decoded}
`))

