// Todoist. In the layout (a hidden 0px block) this copy syncs task counts to
// shared("todoist") (sync.js). Opened as an overlay (`mod.open:todoist`, or a click on
// the status bar's counts) it is the task list (list.js).

import { View } from "gpui-kit";
import { props } from "herdr";
import Sync from "./sync.js";
import TaskList from "./list.js";

export default class Todoist extends View {
  init(_props, cx) {
    this.part = props()?.overlay ? new TaskList() : new Sync();
    this.part.init(cx);
  }

  render(cx) {
    return this.part.render(cx);
  }
}
