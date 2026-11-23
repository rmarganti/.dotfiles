import { exec, panes, run, terminals } from "herdr";
import { jumpToLink } from "./jump.js";

export function handleLink(click) {
  return jumpToLink(click, { exec, panes, run, terminals });
}
