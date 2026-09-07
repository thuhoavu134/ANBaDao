const OWNER_NAME = /^[A-Za-z][A-Za-z0-9._:-]{0,79}$/;

function displayOwner(owner) {
  const value = String(owner ?? 'scene').trim();
  return OWNER_NAME.test(value) ? value : 'scene';
}

function errorRecord(owner, id, error) {
  return {
    owner,
    id,
    message: error instanceof Error ? error.message : String(error)
  };
}

/**
 * Small, dependency-free scope for resources owned by one scene activation.
 * The scope deliberately does not own the DOM root: a route may hide and
 * reuse that root, while activation work (RAF, timers, observers and loads)
 * must be disposable and replaceable.
 */
export function createSceneLifetime(owner = 'scene') {
  const name = displayOwner(owner);
  const entries = new Map();
  const errors = [];
  let nextId = 0;
  let generation = 0;
  let disposed = false;

  function run(entry) {
    try {
      entry.dispose();
      return true;
    } catch (error) {
      errors.push(errorRecord(name, entry.id, error));
      return false;
    }
  }

  function add(disposer) {
    if (typeof disposer !== 'function') throw new TypeError('Scene disposer phải là function.');
    const entry = { id: ++nextId, dispose: disposer };
    if (disposed) {
      run(entry);
      return () => false;
    }
    entries.set(entry.id, entry);
    let released = false;
    return () => {
      if (released) return false;
      released = true;
      if (!entries.delete(entry.id)) return false;
      return run(entry);
    };
  }

  function track(resource, disposer) {
    if (typeof disposer !== 'function') throw new TypeError('Resource disposer phải là function.');
    add(() => disposer(resource));
    return resource;
  }

  function trackEventListener(target, type, listener, options) {
    if (!target || typeof target.addEventListener !== 'function' ||
        typeof target.removeEventListener !== 'function') {
      throw new TypeError('Event target của scene không hợp lệ.');
    }
    if (disposed) return false;
    target.addEventListener(type, listener, options);
    return add(() => target.removeEventListener(type, listener, options));
  }

  function trackTimeout(callback, delay, ...args) {
    let release = null;
    const handle = setTimeout(() => {
      release?.();
      if (!disposed) callback(...args);
    }, delay);
    release = add(() => clearTimeout(handle));
    return handle;
  }

  function trackInterval(callback, delay, ...args) {
    const handle = setInterval(() => {
      if (!disposed) callback(...args);
    }, delay);
    return track(handle, clearInterval);
  }

  function trackAnimationFrame(callback) {
    const handle = requestAnimationFrame(time => {
      if (!disposed) callback(time);
    });
    return track(handle, cancelAnimationFrame);
  }

  function trackObserver(observer) {
    if (!observer || typeof observer.disconnect !== 'function') {
      throw new TypeError('Observer của scene không hợp lệ.');
    }
    return track(observer, value => value.disconnect());
  }

  function trackAbortController(controller = new AbortController()) {
    if (!controller || typeof controller.abort !== 'function') {
      throw new TypeError('AbortController của scene không hợp lệ.');
    }
    return track(controller, value => {
      if (!value.signal?.aborted) value.abort();
    });
  }

  function guard(callback) {
    if (typeof callback !== 'function') throw new TypeError('Scene callback phải là function.');
    return (...args) => disposed ? undefined : callback(...args);
  }

  function dispose() {
    if (disposed) {
      return { ok: errors.length === 0, owner: name, disposed: true, released: 0, errors: [...errors] };
    }
    disposed = true;
    generation += 1;
    const pending = [...entries.values()].reverse();
    entries.clear();
    let released = 0;
    for (const entry of pending) if (run(entry)) released += 1;
    return { ok: errors.length === 0, owner: name, disposed: true, released, errors: [...errors] };
  }

  function snapshot() {
    return {
      owner: name,
      disposed,
      generation,
      pending: entries.size,
      registrations: nextId,
      errors: [...errors]
    };
  }

  return Object.freeze({
    add,
    track,
    trackEventListener,
    trackTimeout,
    trackInterval,
    trackAnimationFrame,
    trackObserver,
    trackAbortController,
    guard,
    dispose,
    isActive: () => !disposed,
    isDisposed: () => disposed,
    generation: () => generation,
    snapshot
  });
}
