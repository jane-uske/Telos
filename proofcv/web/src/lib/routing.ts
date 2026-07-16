// 单页 SPA 的浏览器路由。
// 现状：导航全靠 store 的 screen/tab（+简历 scope），URL 恒为 "/"，所以浏览器前进/后退失效、
// 用户「点着点着返回不了」。这里把导航状态双向映射到真实路径：
//   状态 → URL：用一个 store 订阅统一 pushState，无需改动散落各处的 go()/setScreen() 调用点；
//   URL → 状态：监听 popstate（后退/前进）与首屏直达/刷新，把路径解析回 store。
// 防循环是天然的：popstate 先改好 location 才触发，回填后算出的目标路径已等于当前 location，不会二次 push。
import { useStore } from "./store";
import type { Tab } from "./types";

type Scope = "base" | "job";
interface Nav {
  screen: "home" | "app";
  tab: Tab;
  scope: Scope;
}

// tab ↔ 顶层路径段：唯一映射源，两个方向都从这里派生
const TAB_TO_SEG: Record<Tab, string> = {
  dashboard: "dashboard",
  evidence: "evidence",
  jobs: "jobs",
  pkg: "pkg",
  resume: "resume",
  qa: "qa",
  mock: "mock",
  records: "records",
  import: "import",
  interview: "interview",
  settings: "settings",
};
const SEG_TO_TAB = Object.fromEntries(
  Object.entries(TAB_TO_SEG).map(([tab, seg]) => [seg, tab as Tab])
) as Record<string, Tab>;

const HOME: Nav = { screen: "home", tab: "dashboard", scope: "base" };

/** 导航状态 → 路径。home 是落地页 "/"；resume 用 ?scope=job 区分定制简历与通用简历。 */
export function navToPath(n: Nav): string {
  if (n.screen === "home") return "/";
  const seg = TAB_TO_SEG[n.tab] ?? "dashboard";
  return n.tab === "resume" && n.scope === "job" ? `/${seg}?scope=job` : `/${seg}`;
}

/** 路径 → 导航状态。未知路径返回 null，交由调用方 fallback。 */
export function pathToNav(pathname: string, search: string): Nav | null {
  const seg = pathname.replace(/^\/+/, "").split("/")[0];
  if (!seg) return HOME;
  const tab = SEG_TO_TAB[seg];
  if (!tab) return null;
  const scope: Scope =
    tab === "resume" && new URLSearchParams(search).get("scope") === "job" ? "job" : "base";
  return { screen: "app", tab, scope };
}

/** 把导航状态写回 store。scope 仅对 resume 有意义，其余 tab 不动它以免误改草稿状态。 */
function applyNav(n: Nav) {
  const patch: Partial<{ screen: "home" | "app"; tab: Tab; resumeScope: Scope }> = {
    screen: n.screen,
    tab: n.tab,
  };
  if (n.tab === "resume") patch.resumeScope = n.scope;
  useStore.setState(patch);
}

let installed = false;

/**
 * 在客户端、且 store 完成 rehydrate 之后调用一次：先对齐首屏（URL↔状态），再挂上双向同步。
 * 返回 cleanup。重复调用是幂等的。
 */
export function installRouter(): () => void {
  if (typeof window === "undefined" || installed) return () => {};
  installed = true;

  // 首屏对齐：URL 指向具体页时以 URL 为准（支持直达/刷新/收藏）；
  // URL 是 "/" 或无法识别时，沿用持久化的上次位置并把地址栏补正回去。
  const urlNav = pathToNav(window.location.pathname, window.location.search);
  if (urlNav && urlNav.screen === "app") {
    applyNav(urlNav);
  } else {
    const s = useStore.getState();
    const path = s.screen === "app" ? navToPath({ screen: "app", tab: s.tab, scope: s.resumeScope }) : "/";
    window.history.replaceState(null, "", path);
  }

  const onPop = () => applyNav(pathToNav(window.location.pathname, window.location.search) ?? HOME);
  window.addEventListener("popstate", onPop);

  const unsub = useStore.subscribe((state, prev) => {
    if (state.screen === prev.screen && state.tab === prev.tab && state.resumeScope === prev.resumeScope) return;
    const target = navToPath({ screen: state.screen, tab: state.tab, scope: state.resumeScope });
    if (target !== window.location.pathname + window.location.search) {
      window.history.pushState(null, "", target);
    }
  });

  return () => {
    window.removeEventListener("popstate", onPop);
    unsub();
    installed = false;
  };
}
