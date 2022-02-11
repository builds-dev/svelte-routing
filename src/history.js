/**
 * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
 *
 * https://github.com/reach/router/blob/master/LICENSE
 * */
import { writable, derived } from "svelte/store";

 function getLocation(source) {
  return {
    ...source.location,
    state: source.history.state,
    key: (source.history.state && source.history.state.key) || "initial"
  };
}

function getIndex(source) {
  return source.history.index;
}

function getStack(source) {
  return source.history.stack;
}

function createHistory(source, options) {
  const listeners = [];
  const location = writable(getLocation(source));
  const index = writable(getIndex(source));
  const stack = writable(getStack(source));

  return {
    get location() {
      return derived(location, location => location);
    },

    get index() {
      return derived(index, index => index);
    },

    get stack() {
      return derived(stack, stack => stack);
    },

    listen(listener) {
      listeners.push(listener);

      const popstateListener = () => {
        location = getLocation(source);
        listener({ location, action: "POP" });
      };

      source.addEventListener("popstate", popstateListener);

      return () => {
        source.removeEventListener("popstate", popstateListener);

        const index = listeners.indexOf(listener);
        listeners.splice(index, 1);
      };
    },

    navigate(to, { state, replace = false } = {}) {
      state = { ...state, key: Date.now() + "" };
      // TODO: handle iOS Safari limits to 100 pushState calls
      const method = replace ? source.history.replaceState : source.history.pushState
      method(state, null, to);

      location.set(getLocation(source));
      index.set(getIndex(source));
      stack.set(getStack(source));
      console.log(index)
      listeners.forEach(listener => listener({ location, action: "PUSH" }));
    },

    go(delta) {
      source.history.go(delta);
      location.set(getLocation(source));
      index.set(getIndex(source));
      const action = index === 0 ? "POP" : "PUSH";
      listeners.forEach(listener => listener({ location, action }));
    },

    goBack() {
      source.history.back()
      location.set(getLocation(source));
      index.set(getIndex(source));
      const action = index === 0 ? "POP" : "PUSH"
      listeners.forEach(listener => listener({ location, action }));
    },

    goForward() {
      source.history.forward()
      location.set(getLocation(source));
      index.set(getIndex(source));
      listeners.forEach(listener => listener({ location, action: "PUSH" }));
    }
  };
}

// Stores history entries in memory for testing or other platforms like Native
function createMemorySource(initialPathname = "/") {
  let index = 0;
  const stack = [{ pathname: initialPathname, search: "" }];
  const states = [];
  const go = (delta = 0) => {
    console.log('go', delta)
    const lower_bound = 0
    const upper_bound = stack.length - 1
    const requested_index = index + delta
    if (requested_index < lower_bound) {
      throw new Error(`Delta exceeds lower bound of history stack. Delta: ${delta}, Current: ${index}; Upper: ${upper_bound}; Lower: ${lower_bound}`)
    }
    if (requested_index > upper_bound) {
      throw new Error(`Delta exceeds upper bound of history stack. Delta: ${delta}, Current: ${index}; Upper: ${upper_bound}; Lower: ${lower_bound}`)
    }
    index = Math.max(0, Math.min(index + delta, upper_bound));
    console.log({ index, upper_bound })
  }

  return {
    get location() {
      return stack[index];
    },
    addEventListener(name, fn) {},
    removeEventListener(name, fn) {},
    history: {
      get entries() {
        return stack;
      },
      get index() {
        return index;
      },
      get state() {
        return states[index];
      },
      get stack() {
        return stack;
      },
      pushState(state, _, uri) {
        const [pathname, search = ""] = uri.split("?");
        stack.splice(index + 1)
        states.splice(index + 1)
        index++;
        stack.push({ pathname, search });
        states.push(state);
      },
      replaceState(state, _, uri) {
        const [pathname, search = ""] = uri.split("?");
        stack[index] = { pathname, search };
        states[index] = state;
      },
      go,
      back() {
        go(-1);
      },
      forward() {
        go(1);
      },
    }
  };
}

export { createHistory, createMemorySource };
