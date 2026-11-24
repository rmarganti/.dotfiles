rex.unbind("cmd+k", "session.switch")

rex.bind("cmd+h", "pane.focus.left")
rex.bind("cmd+j", "pane.focus.down")
rex.bind("cmd+k", "pane.focus.up")
rex.bind("cmd+l", "pane.focus.right")
rex.bind("cmd+p", "pane.go_to")

rex.bind("shift+cmd+h", "pane.resize", { direction = "left" })
rex.bind("shift+cmd+j", "pane.resize", { direction = "down" })
rex.bind("shift+cmd+k", "pane.resize", { direction = "up" })
rex.bind("shift+cmd+l", "pane.resize", { direction = "right" })

rex.bind("alt+cmd+h", "pane.move.left")
rex.bind("alt+cmd+j", "pane.move.down")
rex.bind("alt+cmd+k", "pane.move.up")
rex.bind("alt+cmd+l", "pane.move.right")

rex.unbind("shift+cmd+,", "client.diagnostics")
rex.bind("shift+cmd+,", "client.tab.rename")
