import "@johnlindquist/kit"
    
// Menu: App Launcher
// Description: Search for an app then launch it
// Author: John Lindquist
// Twitter: @johnlindquist

let createChoices = async () => {
  let apps = await fileSearch("", {
    onlyin: "/",
    kind: "application",
  })

  let prefs = await fileSearch("", {
    onlyin: "/",
    kind: "preferences",
  })

  let group = path => apps =>
    apps
      .filter(app => app.match(path))
      .sort((a, b) => {
        let aName = a.replace(/.*\//, "")
        let bName = b.replace(/.*\//, "")

        return aName > bName ? 1 : aName < bName ? -1 : 0
      })

  return [
    ...group(/^\/Applications\/(?!Utilities)/)(apps),
    ...group(/\.prefPane$/)(prefs),
    ...group(/^\/Applications\/Utilities/)(apps),
    ...group(/System/)(apps),
    ...group(/Users/)(apps),
  ].map(value => {
    return {
      name: value.split("/").pop().replace(".app", ""),
      value,
      description: value,
    }
  })
}

let appsDb = await db("apps", async () => ({
  choices: await createChoices(),
}))

let app = await arg("Select app:", appsDb.choices)
let command = `open -a "${app}"`
if (app.endsWith(".prefPane")) {
  command = `open ${app}`
}
exec(command)
