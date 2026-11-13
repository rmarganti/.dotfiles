// node --test main.test.js — render the real toolbar with mocked native builders.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

const env = globalThis.__toolbar = {commands: []};
globalThis.localStorage = {getItem: () => null, setItem() {}};
const mocks = {
  "gpui-kit": `
    export class View {}
    export function div() {
      const node = {nodes: [], styles: {}, events: {}};
      let proxy;
      proxy = new Proxy(node, {get(target, key) {
        if (key in target) return target[key];
        if (key === 'when') return (condition, fn) => {if (condition) fn(proxy); return proxy;};
        if (key === 'child') return child => {node.nodes.push(child); return proxy;};
        if (key === 'children') return children => {node.nodes.push(...children); return proxy;};
        if (key.startsWith('on_')) return fn => {node.events[key] = fn; return proxy;};
        return (...args) => {node.styles[key] = args; return proxy;};
      }});
      return proxy;
    }
    export const svg = path => {const el = div(); el.styles.asset = path; return el;};
    export const image = svg;
  `,
  "gpui-base": `import {div} from 'gpui-kit'; export const h_flex = div;`,
  herdr: `
    export const spaces = () => [];
    export const panes = () => [];
    export const run = (...args) => globalThis.__toolbar.commands.push(args);
    export const openOverlay = () => {};
    export const theme = () => ({chrome:'chrome',selected:'selected',foreground:'foreground',muted:'muted',accent:'accent'});
    export const window = () => ({platform:'macos'});
    export const shared = key => key === 'workspace.panels' ? ['files','changes','ci-dash','gh-prs']
      : key === 'gh-prs.inbox' ? {requested:Array(globalThis.__toolbar.count ?? 3)} : null;
    export const layout = () => ({id:'panel',hidden:globalThis.__toolbar.hidden ?? false,children:[{id:'panel-body',active:globalThis.__toolbar.active ?? 'ci-dash'}]});
    export const settings = () => ({zoom:1});
    export const home = () => '/home/test';
  `,
};
registerHooks({resolve(specifier, context, next) {
  return specifier in mocks ? {url:`data:text/javascript,${encodeURIComponent(mocks[specifier])}`,shortCircuit:true} : next(specifier, context);
}});
const {default: Tabs} = await import("./main.js");
const walk = node => typeof node === "object" ? [node, ...(node.nodes ?? []).flatMap(walk)] : [];
function render() {const tabs = new Tabs(); tabs.init(); return tabs.render();}
const buttons = root => walk(root).filter(n => /^panel-/.test(n.styles.id?.[0] ?? ""));

test("Files, Changes, CI, and PRs share one toolbar and identical spacing", () => {
  const root = render(), all = buttons(root);
  assert.deepEqual(all.map(n => n.styles.id[0]), ["panel-files","panel-changes","panel-ci-dash","panel-gh-prs"]);
  assert.deepEqual(root.styles.gap, [3]);
  for (const button of all) {
    for (const [style, value] of Object.entries({h:26,px:8,gap:5,rounded:6,text_size:12})) {
      assert.deepEqual(button.styles[style], [value], `${button.styles.id}: ${style}`);
    }
    const icon = button.nodes[0];
    assert.deepEqual(icon.styles.size, [14]);
    assert.deepEqual(icon.styles.flex_none, []);
    assert.equal(typeof icon.styles.asset, "string");
  }
  assert.equal(all[2].nodes[0].styles.asset, "mods/ci-dash/ci.svg");
});

test("the PR badge is preserved without a separate fixed-width block", () => {
  const prs = buttons(render()).at(-1);
  assert.equal(prs.nodes[2].nodes[0], "· 3");
  env.count = 0;
  assert.equal(buttons(render()).at(-1).nodes.length, 2);
  env.count = 3;
});

test("each toggle selects its panel or hides it when already active", () => {
  env.commands = [];
  const all = buttons(render());
  for (const button of all) button.events.on_click();
  assert.deepEqual(env.commands, [
    ["layout.select",{stack:"panel-body",child:"files"}], ["layout.show",{id:"panel"}],
    ["layout.select",{stack:"panel-body",child:"changes"}], ["layout.show",{id:"panel"}],
    ["layout.hide",{id:"panel"}],
    ["layout.select",{stack:"panel-body",child:"gh-prs"}], ["layout.show",{id:"panel"}],
  ]);
});

test("all four toggles use the same selected and unselected styling", () => {
  for (const active of ["files","changes","ci-dash","gh-prs"]) {
    env.active = active;
    for (const button of buttons(render())) {
      const on = button.styles.id[0] === `panel-${active}`;
      assert.deepEqual(button.styles.bg, [on ? "selected" : "chrome"]);
      assert.deepEqual(button.styles.text_color, [on ? "foreground" : "muted"]);
    }
  }
});
