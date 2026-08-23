import type { Action, ActionBase, ConditionAction, HttpMethod } from "./types";

let sequence = 0;

export function variable(name: string): string {
  if (!name.trim()) throw new TypeError("Variable name must not be empty");
  return `{$${name}}`;
}

export function action<T extends Action>(input: T): T {
  return { id: input.id ?? nextActionId(input.type), ...input } as T;
}

export const actions = {
  navigate: (url: string, base?: ActionBase) => action({ ...base, type: "navigate", value: url }),
  click: (selector: string, base?: ActionBase) => action({ ...base, type: "click", selector }),
  type: (selector: string, value: string, mode: "replace" | "append" = "replace", base?: ActionBase) =>
    action({ ...base, type: "type", selector, value, typeMode: mode }),
  wait: (seconds: number, base?: ActionBase) => action({ ...base, type: "wait", value: String(seconds) }),
  waitFor: (selector: string, base?: ActionBase) => action({ ...base, type: "wait_selector", selector }),
  press: (key: string, selector?: string, base?: ActionBase) =>
    action({ ...base, type: "press", key, ...(selector === undefined ? {} : { selector }) }),
  javascript: (script: string, varName?: string, base?: ActionBase) =>
    action({ ...base, type: "javascript", value: script, ...(varName === undefined ? {} : { varName }) }),
  hover: (selector: string, base?: ActionBase) => action({ ...base, type: "hover", selector }),
  screenshot: (name?: string, base?: ActionBase) =>
    action({ ...base, type: "screenshot", ...(name === undefined ? {} : { value: name }) }),
  set: (varName: string, value: string, base?: ActionBase) => action({ ...base, type: "set", varName, value }),
  merge: (varName: string, value: string, base?: ActionBase) => action({ ...base, type: "merge", varName, value }),
  getContent: (selector?: string, varName?: string, base?: ActionBase) =>
    action({ ...base, type: "get_content", ...(selector === undefined ? {} : { selector }), ...(varName === undefined ? {} : { varName }) }),
  request: (url: string, input: { method?: HttpMethod; headers?: string; body?: string; varName?: string } = {}, base?: ActionBase) =>
    action({ ...base, type: "http_request", value: url, ...input }),
  if: (condition: Omit<ConditionAction<"if">, "id" | "type">, base?: ActionBase) => action({ ...base, type: "if", ...condition }),
  while: (condition: Omit<ConditionAction<"while">, "id" | "type">, base?: ActionBase) => action({ ...base, type: "while", ...condition }),
  else: (base?: ActionBase) => action({ ...base, type: "else" }),
  end: (base?: ActionBase) => action({ ...base, type: "end" }),
  repeat: (count: number, base?: ActionBase) => action({ ...base, type: "repeat", value: String(count) }),
  stop: (status = "success", base?: ActionBase) => action({ ...base, type: "stop", value: status }),
  start: (taskId: string, base?: ActionBase) => action({ ...base, type: "start", value: taskId }),
  solveCaptcha: (input: Extract<Action, { type: "solve_captcha" }> extends infer A ? Omit<A & object, "id" | "type"> : never = {}, base?: ActionBase) =>
    action({ ...base, type: "solve_captcha", ...input }),
};

function nextActionId(type: Action["type"]): string {
  sequence = (sequence + 1) % Number.MAX_SAFE_INTEGER;
  return `act_${type}_${Date.now().toString(36)}_${sequence.toString(36)}`;
}
