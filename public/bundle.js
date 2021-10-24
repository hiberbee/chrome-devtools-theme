
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                let j = 0;
                const remove = [];
                while (j < node.attributes.length) {
                    const attribute = node.attributes[j++];
                    if (!attributes[attribute.name]) {
                        remove.push(attribute.name);
                    }
                }
                for (let k = 0; k < remove.length; k++) {
                    node.removeAttribute(remove[k]);
                }
                return nodes.splice(i, 1)[0];
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function claim_text(nodes, data) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeType === 3) {
                node.data = '' + data;
                return nodes.splice(i, 1)[0];
            }
        }
        return text(data);
    }
    function claim_space(nodes) {
        return claim_text(nodes, ' ');
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function claim_component(block, parent_nodes) {
        block && block.l(parent_nodes);
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
    function isNothing(subject) {
      return (typeof subject === 'undefined') || (subject === null);
    }


    function isObject(subject) {
      return (typeof subject === 'object') && (subject !== null);
    }


    function toArray(sequence) {
      if (Array.isArray(sequence)) return sequence;
      else if (isNothing(sequence)) return [];

      return [ sequence ];
    }


    function extend(target, source) {
      var index, length, key, sourceKeys;

      if (source) {
        sourceKeys = Object.keys(source);

        for (index = 0, length = sourceKeys.length; index < length; index += 1) {
          key = sourceKeys[index];
          target[key] = source[key];
        }
      }

      return target;
    }


    function repeat(string, count) {
      var result = '', cycle;

      for (cycle = 0; cycle < count; cycle += 1) {
        result += string;
      }

      return result;
    }


    function isNegativeZero(number) {
      return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
    }


    var isNothing_1      = isNothing;
    var isObject_1       = isObject;
    var toArray_1        = toArray;
    var repeat_1         = repeat;
    var isNegativeZero_1 = isNegativeZero;
    var extend_1         = extend;

    var common = {
    	isNothing: isNothing_1,
    	isObject: isObject_1,
    	toArray: toArray_1,
    	repeat: repeat_1,
    	isNegativeZero: isNegativeZero_1,
    	extend: extend_1
    };

    // YAML error class. http://stackoverflow.com/questions/8458984


    function formatError(exception, compact) {
      var where = '', message = exception.reason || '(unknown reason)';

      if (!exception.mark) return message;

      if (exception.mark.name) {
        where += 'in "' + exception.mark.name + '" ';
      }

      where += '(' + (exception.mark.line + 1) + ':' + (exception.mark.column + 1) + ')';

      if (!compact && exception.mark.snippet) {
        where += '\n\n' + exception.mark.snippet;
      }

      return message + ' ' + where;
    }


    function YAMLException$1(reason, mark) {
      // Super constructor
      Error.call(this);

      this.name = 'YAMLException';
      this.reason = reason;
      this.mark = mark;
      this.message = formatError(this, false);

      // Include stack trace in error object
      if (Error.captureStackTrace) {
        // Chrome and NodeJS
        Error.captureStackTrace(this, this.constructor);
      } else {
        // FF, IE 10+ and Safari 6+. Fallback for others
        this.stack = (new Error()).stack || '';
      }
    }


    // Inherit from Error
    YAMLException$1.prototype = Object.create(Error.prototype);
    YAMLException$1.prototype.constructor = YAMLException$1;


    YAMLException$1.prototype.toString = function toString(compact) {
      return this.name + ': ' + formatError(this, compact);
    };


    var exception = YAMLException$1;

    // get snippet for a single line, respecting maxLength
    function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
      var head = '';
      var tail = '';
      var maxHalfLength = Math.floor(maxLineLength / 2) - 1;

      if (position - lineStart > maxHalfLength) {
        head = ' ... ';
        lineStart = position - maxHalfLength + head.length;
      }

      if (lineEnd - position > maxHalfLength) {
        tail = ' ...';
        lineEnd = position + maxHalfLength - tail.length;
      }

      return {
        str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, '→') + tail,
        pos: position - lineStart + head.length // relative position
      };
    }


    function padStart(string, max) {
      return common.repeat(' ', max - string.length) + string;
    }


    function makeSnippet(mark, options) {
      options = Object.create(options || null);

      if (!mark.buffer) return null;

      if (!options.maxLength) options.maxLength = 79;
      if (typeof options.indent      !== 'number') options.indent      = 1;
      if (typeof options.linesBefore !== 'number') options.linesBefore = 3;
      if (typeof options.linesAfter  !== 'number') options.linesAfter  = 2;

      var re = /\r?\n|\r|\0/g;
      var lineStarts = [ 0 ];
      var lineEnds = [];
      var match;
      var foundLineNo = -1;

      while ((match = re.exec(mark.buffer))) {
        lineEnds.push(match.index);
        lineStarts.push(match.index + match[0].length);

        if (mark.position <= match.index && foundLineNo < 0) {
          foundLineNo = lineStarts.length - 2;
        }
      }

      if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;

      var result = '', i, line;
      var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
      var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);

      for (i = 1; i <= options.linesBefore; i++) {
        if (foundLineNo - i < 0) break;
        line = getLine(
          mark.buffer,
          lineStarts[foundLineNo - i],
          lineEnds[foundLineNo - i],
          mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
          maxLineLength
        );
        result = common.repeat(' ', options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) +
          ' | ' + line.str + '\n' + result;
      }

      line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
      result += common.repeat(' ', options.indent) + padStart((mark.line + 1).toString(), lineNoLength) +
        ' | ' + line.str + '\n';
      result += common.repeat('-', options.indent + lineNoLength + 3 + line.pos) + '^' + '\n';

      for (i = 1; i <= options.linesAfter; i++) {
        if (foundLineNo + i >= lineEnds.length) break;
        line = getLine(
          mark.buffer,
          lineStarts[foundLineNo + i],
          lineEnds[foundLineNo + i],
          mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
          maxLineLength
        );
        result += common.repeat(' ', options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) +
          ' | ' + line.str + '\n';
      }

      return result.replace(/\n$/, '');
    }


    var snippet = makeSnippet;

    var TYPE_CONSTRUCTOR_OPTIONS = [
      'kind',
      'multi',
      'resolve',
      'construct',
      'instanceOf',
      'predicate',
      'represent',
      'representName',
      'defaultStyle',
      'styleAliases'
    ];

    var YAML_NODE_KINDS = [
      'scalar',
      'sequence',
      'mapping'
    ];

    function compileStyleAliases(map) {
      var result = {};

      if (map !== null) {
        Object.keys(map).forEach(function (style) {
          map[style].forEach(function (alias) {
            result[String(alias)] = style;
          });
        });
      }

      return result;
    }

    function Type$1(tag, options) {
      options = options || {};

      Object.keys(options).forEach(function (name) {
        if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
          throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        }
      });

      // TODO: Add tag format check.
      this.options       = options; // keep original options in case user wants to extend this type later
      this.tag           = tag;
      this.kind          = options['kind']          || null;
      this.resolve       = options['resolve']       || function () { return true; };
      this.construct     = options['construct']     || function (data) { return data; };
      this.instanceOf    = options['instanceOf']    || null;
      this.predicate     = options['predicate']     || null;
      this.represent     = options['represent']     || null;
      this.representName = options['representName'] || null;
      this.defaultStyle  = options['defaultStyle']  || null;
      this.multi         = options['multi']         || false;
      this.styleAliases  = compileStyleAliases(options['styleAliases'] || null);

      if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
        throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
    }

    var type = Type$1;

    /*eslint-disable max-len*/





    function compileList(schema, name) {
      var result = [];

      schema[name].forEach(function (currentType) {
        var newIndex = result.length;

        result.forEach(function (previousType, previousIndex) {
          if (previousType.tag === currentType.tag &&
              previousType.kind === currentType.kind &&
              previousType.multi === currentType.multi) {

            newIndex = previousIndex;
          }
        });

        result[newIndex] = currentType;
      });

      return result;
    }


    function compileMap(/* lists... */) {
      var result = {
            scalar: {},
            sequence: {},
            mapping: {},
            fallback: {},
            multi: {
              scalar: [],
              sequence: [],
              mapping: [],
              fallback: []
            }
          }, index, length;

      function collectType(type) {
        if (type.multi) {
          result.multi[type.kind].push(type);
          result.multi['fallback'].push(type);
        } else {
          result[type.kind][type.tag] = result['fallback'][type.tag] = type;
        }
      }

      for (index = 0, length = arguments.length; index < length; index += 1) {
        arguments[index].forEach(collectType);
      }
      return result;
    }


    function Schema$1(definition) {
      return this.extend(definition);
    }


    Schema$1.prototype.extend = function extend(definition) {
      var implicit = [];
      var explicit = [];

      if (definition instanceof type) {
        // Schema.extend(type)
        explicit.push(definition);

      } else if (Array.isArray(definition)) {
        // Schema.extend([ type1, type2, ... ])
        explicit = explicit.concat(definition);

      } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
        // Schema.extend({ explicit: [ type1, type2, ... ], implicit: [ type1, type2, ... ] })
        if (definition.implicit) implicit = implicit.concat(definition.implicit);
        if (definition.explicit) explicit = explicit.concat(definition.explicit);

      } else {
        throw new exception('Schema.extend argument should be a Type, [ Type ], ' +
          'or a schema definition ({ implicit: [...], explicit: [...] })');
      }

      implicit.forEach(function (type$1) {
        if (!(type$1 instanceof type)) {
          throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
        }

        if (type$1.loadKind && type$1.loadKind !== 'scalar') {
          throw new exception('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
        }

        if (type$1.multi) {
          throw new exception('There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.');
        }
      });

      explicit.forEach(function (type$1) {
        if (!(type$1 instanceof type)) {
          throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
        }
      });

      var result = Object.create(Schema$1.prototype);

      result.implicit = (this.implicit || []).concat(implicit);
      result.explicit = (this.explicit || []).concat(explicit);

      result.compiledImplicit = compileList(result, 'implicit');
      result.compiledExplicit = compileList(result, 'explicit');
      result.compiledTypeMap  = compileMap(result.compiledImplicit, result.compiledExplicit);

      return result;
    };


    var schema = Schema$1;

    var str = new type('tag:yaml.org,2002:str', {
      kind: 'scalar',
      construct: function (data) { return data !== null ? data : ''; }
    });

    var seq = new type('tag:yaml.org,2002:seq', {
      kind: 'sequence',
      construct: function (data) { return data !== null ? data : []; }
    });

    var map = new type('tag:yaml.org,2002:map', {
      kind: 'mapping',
      construct: function (data) { return data !== null ? data : {}; }
    });

    var failsafe = new schema({
      explicit: [
        str,
        seq,
        map
      ]
    });

    function resolveYamlNull(data) {
      if (data === null) return true;

      var max = data.length;

      return (max === 1 && data === '~') ||
             (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
    }

    function constructYamlNull() {
      return null;
    }

    function isNull(object) {
      return object === null;
    }

    var _null = new type('tag:yaml.org,2002:null', {
      kind: 'scalar',
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function () { return '~';    },
        lowercase: function () { return 'null'; },
        uppercase: function () { return 'NULL'; },
        camelcase: function () { return 'Null'; },
        empty:     function () { return '';     }
      },
      defaultStyle: 'lowercase'
    });

    function resolveYamlBoolean(data) {
      if (data === null) return false;

      var max = data.length;

      return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
             (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
    }

    function constructYamlBoolean(data) {
      return data === 'true' ||
             data === 'True' ||
             data === 'TRUE';
    }

    function isBoolean(object) {
      return Object.prototype.toString.call(object) === '[object Boolean]';
    }

    var bool = new type('tag:yaml.org,2002:bool', {
      kind: 'scalar',
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function (object) { return object ? 'true' : 'false'; },
        uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
        camelcase: function (object) { return object ? 'True' : 'False'; }
      },
      defaultStyle: 'lowercase'
    });

    function isHexCode(c) {
      return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
             ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
             ((0x61/* a */ <= c) && (c <= 0x66/* f */));
    }

    function isOctCode(c) {
      return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
    }

    function isDecCode(c) {
      return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
    }

    function resolveYamlInteger(data) {
      if (data === null) return false;

      var max = data.length,
          index = 0,
          hasDigits = false,
          ch;

      if (!max) return false;

      ch = data[index];

      // sign
      if (ch === '-' || ch === '+') {
        ch = data[++index];
      }

      if (ch === '0') {
        // 0
        if (index + 1 === max) return true;
        ch = data[++index];

        // base 2, base 8, base 16

        if (ch === 'b') {
          // base 2
          index++;

          for (; index < max; index++) {
            ch = data[index];
            if (ch === '_') continue;
            if (ch !== '0' && ch !== '1') return false;
            hasDigits = true;
          }
          return hasDigits && ch !== '_';
        }


        if (ch === 'x') {
          // base 16
          index++;

          for (; index < max; index++) {
            ch = data[index];
            if (ch === '_') continue;
            if (!isHexCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && ch !== '_';
        }


        if (ch === 'o') {
          // base 8
          index++;

          for (; index < max; index++) {
            ch = data[index];
            if (ch === '_') continue;
            if (!isOctCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && ch !== '_';
        }
      }

      // base 10 (except 0)

      // value should not start with `_`;
      if (ch === '_') return false;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isDecCode(data.charCodeAt(index))) {
          return false;
        }
        hasDigits = true;
      }

      // Should have digits and should not end with `_`
      if (!hasDigits || ch === '_') return false;

      return true;
    }

    function constructYamlInteger(data) {
      var value = data, sign = 1, ch;

      if (value.indexOf('_') !== -1) {
        value = value.replace(/_/g, '');
      }

      ch = value[0];

      if (ch === '-' || ch === '+') {
        if (ch === '-') sign = -1;
        value = value.slice(1);
        ch = value[0];
      }

      if (value === '0') return 0;

      if (ch === '0') {
        if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
        if (value[1] === 'x') return sign * parseInt(value.slice(2), 16);
        if (value[1] === 'o') return sign * parseInt(value.slice(2), 8);
      }

      return sign * parseInt(value, 10);
    }

    function isInteger(object) {
      return (Object.prototype.toString.call(object)) === '[object Number]' &&
             (object % 1 === 0 && !common.isNegativeZero(object));
    }

    var int = new type('tag:yaml.org,2002:int', {
      kind: 'scalar',
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
        octal:       function (obj) { return obj >= 0 ? '0o'  + obj.toString(8) : '-0o'  + obj.toString(8).slice(1); },
        decimal:     function (obj) { return obj.toString(10); },
        /* eslint-disable max-len */
        hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
      },
      defaultStyle: 'decimal',
      styleAliases: {
        binary:      [ 2,  'bin' ],
        octal:       [ 8,  'oct' ],
        decimal:     [ 10, 'dec' ],
        hexadecimal: [ 16, 'hex' ]
      }
    });

    var YAML_FLOAT_PATTERN = new RegExp(
      // 2.5e4, 2.5 and integers
      '^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
      // .2e4, .2
      // special case, seems not from spec
      '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
      // .inf
      '|[-+]?\\.(?:inf|Inf|INF)' +
      // .nan
      '|\\.(?:nan|NaN|NAN))$');

    function resolveYamlFloat(data) {
      if (data === null) return false;

      if (!YAML_FLOAT_PATTERN.test(data) ||
          // Quick hack to not allow integers end with `_`
          // Probably should update regexp & check speed
          data[data.length - 1] === '_') {
        return false;
      }

      return true;
    }

    function constructYamlFloat(data) {
      var value, sign;

      value  = data.replace(/_/g, '').toLowerCase();
      sign   = value[0] === '-' ? -1 : 1;

      if ('+-'.indexOf(value[0]) >= 0) {
        value = value.slice(1);
      }

      if (value === '.inf') {
        return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

      } else if (value === '.nan') {
        return NaN;
      }
      return sign * parseFloat(value, 10);
    }


    var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

    function representYamlFloat(object, style) {
      var res;

      if (isNaN(object)) {
        switch (style) {
          case 'lowercase': return '.nan';
          case 'uppercase': return '.NAN';
          case 'camelcase': return '.NaN';
        }
      } else if (Number.POSITIVE_INFINITY === object) {
        switch (style) {
          case 'lowercase': return '.inf';
          case 'uppercase': return '.INF';
          case 'camelcase': return '.Inf';
        }
      } else if (Number.NEGATIVE_INFINITY === object) {
        switch (style) {
          case 'lowercase': return '-.inf';
          case 'uppercase': return '-.INF';
          case 'camelcase': return '-.Inf';
        }
      } else if (common.isNegativeZero(object)) {
        return '-0.0';
      }

      res = object.toString(10);

      // JS stringifier can build scientific format without dots: 5e-100,
      // while YAML requres dot: 5.e-100. Fix it with simple hack

      return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
    }

    function isFloat(object) {
      return (Object.prototype.toString.call(object) === '[object Number]') &&
             (object % 1 !== 0 || common.isNegativeZero(object));
    }

    var float = new type('tag:yaml.org,2002:float', {
      kind: 'scalar',
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: 'lowercase'
    });

    var json = failsafe.extend({
      implicit: [
        _null,
        bool,
        int,
        float
      ]
    });

    var core = json;

    var YAML_DATE_REGEXP = new RegExp(
      '^([0-9][0-9][0-9][0-9])'          + // [1] year
      '-([0-9][0-9])'                    + // [2] month
      '-([0-9][0-9])$');                   // [3] day

    var YAML_TIMESTAMP_REGEXP = new RegExp(
      '^([0-9][0-9][0-9][0-9])'          + // [1] year
      '-([0-9][0-9]?)'                   + // [2] month
      '-([0-9][0-9]?)'                   + // [3] day
      '(?:[Tt]|[ \\t]+)'                 + // ...
      '([0-9][0-9]?)'                    + // [4] hour
      ':([0-9][0-9])'                    + // [5] minute
      ':([0-9][0-9])'                    + // [6] second
      '(?:\\.([0-9]*))?'                 + // [7] fraction
      '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
      '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

    function resolveYamlTimestamp(data) {
      if (data === null) return false;
      if (YAML_DATE_REGEXP.exec(data) !== null) return true;
      if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
      return false;
    }

    function constructYamlTimestamp(data) {
      var match, year, month, day, hour, minute, second, fraction = 0,
          delta = null, tz_hour, tz_minute, date;

      match = YAML_DATE_REGEXP.exec(data);
      if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

      if (match === null) throw new Error('Date resolve error');

      // match: [1] year [2] month [3] day

      year = +(match[1]);
      month = +(match[2]) - 1; // JS month starts with 0
      day = +(match[3]);

      if (!match[4]) { // no hour
        return new Date(Date.UTC(year, month, day));
      }

      // match: [4] hour [5] minute [6] second [7] fraction

      hour = +(match[4]);
      minute = +(match[5]);
      second = +(match[6]);

      if (match[7]) {
        fraction = match[7].slice(0, 3);
        while (fraction.length < 3) { // milli-seconds
          fraction += '0';
        }
        fraction = +fraction;
      }

      // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

      if (match[9]) {
        tz_hour = +(match[10]);
        tz_minute = +(match[11] || 0);
        delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
        if (match[9] === '-') delta = -delta;
      }

      date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

      if (delta) date.setTime(date.getTime() - delta);

      return date;
    }

    function representYamlTimestamp(object /*, style*/) {
      return object.toISOString();
    }

    var timestamp = new type('tag:yaml.org,2002:timestamp', {
      kind: 'scalar',
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });

    function resolveYamlMerge(data) {
      return data === '<<' || data === null;
    }

    var merge = new type('tag:yaml.org,2002:merge', {
      kind: 'scalar',
      resolve: resolveYamlMerge
    });

    /*eslint-disable no-bitwise*/





    // [ 64, 65, 66 ] -> [ padding, CR, LF ]
    var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


    function resolveYamlBinary(data) {
      if (data === null) return false;

      var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

      // Convert one by one.
      for (idx = 0; idx < max; idx++) {
        code = map.indexOf(data.charAt(idx));

        // Skip CR/LF
        if (code > 64) continue;

        // Fail on illegal characters
        if (code < 0) return false;

        bitlen += 6;
      }

      // If there are any bits left, source was corrupted
      return (bitlen % 8) === 0;
    }

    function constructYamlBinary(data) {
      var idx, tailbits,
          input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
          max = input.length,
          map = BASE64_MAP,
          bits = 0,
          result = [];

      // Collect by 6*4 bits (3 bytes)

      for (idx = 0; idx < max; idx++) {
        if ((idx % 4 === 0) && idx) {
          result.push((bits >> 16) & 0xFF);
          result.push((bits >> 8) & 0xFF);
          result.push(bits & 0xFF);
        }

        bits = (bits << 6) | map.indexOf(input.charAt(idx));
      }

      // Dump tail

      tailbits = (max % 4) * 6;

      if (tailbits === 0) {
        result.push((bits >> 16) & 0xFF);
        result.push((bits >> 8) & 0xFF);
        result.push(bits & 0xFF);
      } else if (tailbits === 18) {
        result.push((bits >> 10) & 0xFF);
        result.push((bits >> 2) & 0xFF);
      } else if (tailbits === 12) {
        result.push((bits >> 4) & 0xFF);
      }

      return new Uint8Array(result);
    }

    function representYamlBinary(object /*, style*/) {
      var result = '', bits = 0, idx, tail,
          max = object.length,
          map = BASE64_MAP;

      // Convert every three bytes to 4 ASCII characters.

      for (idx = 0; idx < max; idx++) {
        if ((idx % 3 === 0) && idx) {
          result += map[(bits >> 18) & 0x3F];
          result += map[(bits >> 12) & 0x3F];
          result += map[(bits >> 6) & 0x3F];
          result += map[bits & 0x3F];
        }

        bits = (bits << 8) + object[idx];
      }

      // Dump tail

      tail = max % 3;

      if (tail === 0) {
        result += map[(bits >> 18) & 0x3F];
        result += map[(bits >> 12) & 0x3F];
        result += map[(bits >> 6) & 0x3F];
        result += map[bits & 0x3F];
      } else if (tail === 2) {
        result += map[(bits >> 10) & 0x3F];
        result += map[(bits >> 4) & 0x3F];
        result += map[(bits << 2) & 0x3F];
        result += map[64];
      } else if (tail === 1) {
        result += map[(bits >> 2) & 0x3F];
        result += map[(bits << 4) & 0x3F];
        result += map[64];
        result += map[64];
      }

      return result;
    }

    function isBinary(obj) {
      return Object.prototype.toString.call(obj) ===  '[object Uint8Array]';
    }

    var binary = new type('tag:yaml.org,2002:binary', {
      kind: 'scalar',
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });

    var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
    var _toString$2       = Object.prototype.toString;

    function resolveYamlOmap(data) {
      if (data === null) return true;

      var objectKeys = [], index, length, pair, pairKey, pairHasKey,
          object = data;

      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        pairHasKey = false;

        if (_toString$2.call(pair) !== '[object Object]') return false;

        for (pairKey in pair) {
          if (_hasOwnProperty$3.call(pair, pairKey)) {
            if (!pairHasKey) pairHasKey = true;
            else return false;
          }
        }

        if (!pairHasKey) return false;

        if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
        else return false;
      }

      return true;
    }

    function constructYamlOmap(data) {
      return data !== null ? data : [];
    }

    var omap = new type('tag:yaml.org,2002:omap', {
      kind: 'sequence',
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });

    var _toString$1 = Object.prototype.toString;

    function resolveYamlPairs(data) {
      if (data === null) return true;

      var index, length, pair, keys, result,
          object = data;

      result = new Array(object.length);

      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];

        if (_toString$1.call(pair) !== '[object Object]') return false;

        keys = Object.keys(pair);

        if (keys.length !== 1) return false;

        result[index] = [ keys[0], pair[keys[0]] ];
      }

      return true;
    }

    function constructYamlPairs(data) {
      if (data === null) return [];

      var index, length, pair, keys, result,
          object = data;

      result = new Array(object.length);

      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];

        keys = Object.keys(pair);

        result[index] = [ keys[0], pair[keys[0]] ];
      }

      return result;
    }

    var pairs = new type('tag:yaml.org,2002:pairs', {
      kind: 'sequence',
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });

    var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;

    function resolveYamlSet(data) {
      if (data === null) return true;

      var key, object = data;

      for (key in object) {
        if (_hasOwnProperty$2.call(object, key)) {
          if (object[key] !== null) return false;
        }
      }

      return true;
    }

    function constructYamlSet(data) {
      return data !== null ? data : {};
    }

    var set = new type('tag:yaml.org,2002:set', {
      kind: 'mapping',
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });

    var _default = core.extend({
      implicit: [
        timestamp,
        merge
      ],
      explicit: [
        binary,
        omap,
        pairs,
        set
      ]
    });

    /*eslint-disable max-len,no-use-before-define*/







    var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;


    var CONTEXT_FLOW_IN   = 1;
    var CONTEXT_FLOW_OUT  = 2;
    var CONTEXT_BLOCK_IN  = 3;
    var CONTEXT_BLOCK_OUT = 4;


    var CHOMPING_CLIP  = 1;
    var CHOMPING_STRIP = 2;
    var CHOMPING_KEEP  = 3;


    var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
    var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
    var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


    function _class(obj) { return Object.prototype.toString.call(obj); }

    function is_EOL(c) {
      return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
    }

    function is_WHITE_SPACE(c) {
      return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
    }

    function is_WS_OR_EOL(c) {
      return (c === 0x09/* Tab */) ||
             (c === 0x20/* Space */) ||
             (c === 0x0A/* LF */) ||
             (c === 0x0D/* CR */);
    }

    function is_FLOW_INDICATOR(c) {
      return c === 0x2C/* , */ ||
             c === 0x5B/* [ */ ||
             c === 0x5D/* ] */ ||
             c === 0x7B/* { */ ||
             c === 0x7D/* } */;
    }

    function fromHexCode(c) {
      var lc;

      if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
        return c - 0x30;
      }

      /*eslint-disable no-bitwise*/
      lc = c | 0x20;

      if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
        return lc - 0x61 + 10;
      }

      return -1;
    }

    function escapedHexLen(c) {
      if (c === 0x78/* x */) { return 2; }
      if (c === 0x75/* u */) { return 4; }
      if (c === 0x55/* U */) { return 8; }
      return 0;
    }

    function fromDecimalCode(c) {
      if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
        return c - 0x30;
      }

      return -1;
    }

    function simpleEscapeSequence(c) {
      /* eslint-disable indent */
      return (c === 0x30/* 0 */) ? '\x00' :
            (c === 0x61/* a */) ? '\x07' :
            (c === 0x62/* b */) ? '\x08' :
            (c === 0x74/* t */) ? '\x09' :
            (c === 0x09/* Tab */) ? '\x09' :
            (c === 0x6E/* n */) ? '\x0A' :
            (c === 0x76/* v */) ? '\x0B' :
            (c === 0x66/* f */) ? '\x0C' :
            (c === 0x72/* r */) ? '\x0D' :
            (c === 0x65/* e */) ? '\x1B' :
            (c === 0x20/* Space */) ? ' ' :
            (c === 0x22/* " */) ? '\x22' :
            (c === 0x2F/* / */) ? '/' :
            (c === 0x5C/* \ */) ? '\x5C' :
            (c === 0x4E/* N */) ? '\x85' :
            (c === 0x5F/* _ */) ? '\xA0' :
            (c === 0x4C/* L */) ? '\u2028' :
            (c === 0x50/* P */) ? '\u2029' : '';
    }

    function charFromCodepoint(c) {
      if (c <= 0xFFFF) {
        return String.fromCharCode(c);
      }
      // Encode UTF-16 surrogate pair
      // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
      return String.fromCharCode(
        ((c - 0x010000) >> 10) + 0xD800,
        ((c - 0x010000) & 0x03FF) + 0xDC00
      );
    }

    var simpleEscapeCheck = new Array(256); // integer, for fast access
    var simpleEscapeMap = new Array(256);
    for (var i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }


    function State$1(input, options) {
      this.input = input;

      this.filename  = options['filename']  || null;
      this.schema    = options['schema']    || _default;
      this.onWarning = options['onWarning'] || null;
      // (Hidden) Remove? makes the loader to expect YAML 1.1 documents
      // if such documents have no explicit %YAML directive
      this.legacy    = options['legacy']    || false;

      this.json      = options['json']      || false;
      this.listener  = options['listener']  || null;

      this.implicitTypes = this.schema.compiledImplicit;
      this.typeMap       = this.schema.compiledTypeMap;

      this.length     = input.length;
      this.position   = 0;
      this.line       = 0;
      this.lineStart  = 0;
      this.lineIndent = 0;

      // position of first leading tab in the current line,
      // used to make sure there are no tabs in the indentation
      this.firstTabInLine = -1;

      this.documents = [];

      /*
      this.version;
      this.checkLineBreaks;
      this.tagMap;
      this.anchorMap;
      this.tag;
      this.anchor;
      this.kind;
      this.result;*/

    }


    function generateError(state, message) {
      var mark = {
        name:     state.filename,
        buffer:   state.input.slice(0, -1), // omit trailing \0
        position: state.position,
        line:     state.line,
        column:   state.position - state.lineStart
      };

      mark.snippet = snippet(mark);

      return new exception(message, mark);
    }

    function throwError(state, message) {
      throw generateError(state, message);
    }

    function throwWarning(state, message) {
      if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
      }
    }


    var directiveHandlers = {

      YAML: function handleYamlDirective(state, name, args) {

        var match, major, minor;

        if (state.version !== null) {
          throwError(state, 'duplication of %YAML directive');
        }

        if (args.length !== 1) {
          throwError(state, 'YAML directive accepts exactly one argument');
        }

        match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

        if (match === null) {
          throwError(state, 'ill-formed argument of the YAML directive');
        }

        major = parseInt(match[1], 10);
        minor = parseInt(match[2], 10);

        if (major !== 1) {
          throwError(state, 'unacceptable YAML version of the document');
        }

        state.version = args[0];
        state.checkLineBreaks = (minor < 2);

        if (minor !== 1 && minor !== 2) {
          throwWarning(state, 'unsupported YAML version of the document');
        }
      },

      TAG: function handleTagDirective(state, name, args) {

        var handle, prefix;

        if (args.length !== 2) {
          throwError(state, 'TAG directive accepts exactly two arguments');
        }

        handle = args[0];
        prefix = args[1];

        if (!PATTERN_TAG_HANDLE.test(handle)) {
          throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
        }

        if (_hasOwnProperty$1.call(state.tagMap, handle)) {
          throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
        }

        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
        }

        try {
          prefix = decodeURIComponent(prefix);
        } catch (err) {
          throwError(state, 'tag prefix is malformed: ' + prefix);
        }

        state.tagMap[handle] = prefix;
      }
    };


    function captureSegment(state, start, end, checkJson) {
      var _position, _length, _character, _result;

      if (start < end) {
        _result = state.input.slice(start, end);

        if (checkJson) {
          for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
            _character = _result.charCodeAt(_position);
            if (!(_character === 0x09 ||
                  (0x20 <= _character && _character <= 0x10FFFF))) {
              throwError(state, 'expected valid JSON character');
            }
          }
        } else if (PATTERN_NON_PRINTABLE.test(_result)) {
          throwError(state, 'the stream contains non-printable characters');
        }

        state.result += _result;
      }
    }

    function mergeMappings(state, destination, source, overridableKeys) {
      var sourceKeys, key, index, quantity;

      if (!common.isObject(source)) {
        throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
      }

      sourceKeys = Object.keys(source);

      for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
        key = sourceKeys[index];

        if (!_hasOwnProperty$1.call(destination, key)) {
          destination[key] = source[key];
          overridableKeys[key] = true;
        }
      }
    }

    function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode,
      startLine, startLineStart, startPos) {

      var index, quantity;

      // The output is a plain object here, so keys can only be strings.
      // We need to convert keyNode to a string, but doing so can hang the process
      // (deeply nested arrays that explode exponentially using aliases).
      if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);

        for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
          if (Array.isArray(keyNode[index])) {
            throwError(state, 'nested arrays are not supported inside keys');
          }

          if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
            keyNode[index] = '[object Object]';
          }
        }
      }

      // Avoid code execution in load() via toString property
      // (still use its own toString for arrays, timestamps,
      // and whatever user schema extensions happen to have @@toStringTag)
      if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
        keyNode = '[object Object]';
      }


      keyNode = String(keyNode);

      if (_result === null) {
        _result = {};
      }

      if (keyTag === 'tag:yaml.org,2002:merge') {
        if (Array.isArray(valueNode)) {
          for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
            mergeMappings(state, _result, valueNode[index], overridableKeys);
          }
        } else {
          mergeMappings(state, _result, valueNode, overridableKeys);
        }
      } else {
        if (!state.json &&
            !_hasOwnProperty$1.call(overridableKeys, keyNode) &&
            _hasOwnProperty$1.call(_result, keyNode)) {
          state.line = startLine || state.line;
          state.lineStart = startLineStart || state.lineStart;
          state.position = startPos || state.position;
          throwError(state, 'duplicated mapping key');
        }

        // used for this specific key only because Object.defineProperty is slow
        if (keyNode === '__proto__') {
          Object.defineProperty(_result, keyNode, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: valueNode
          });
        } else {
          _result[keyNode] = valueNode;
        }
        delete overridableKeys[keyNode];
      }

      return _result;
    }

    function readLineBreak(state) {
      var ch;

      ch = state.input.charCodeAt(state.position);

      if (ch === 0x0A/* LF */) {
        state.position++;
      } else if (ch === 0x0D/* CR */) {
        state.position++;
        if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
          state.position++;
        }
      } else {
        throwError(state, 'a line break is expected');
      }

      state.line += 1;
      state.lineStart = state.position;
      state.firstTabInLine = -1;
    }

    function skipSeparationSpace(state, allowComments, checkIndent) {
      var lineBreaks = 0,
          ch = state.input.charCodeAt(state.position);

      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          if (ch === 0x09/* Tab */ && state.firstTabInLine === -1) {
            state.firstTabInLine = state.position;
          }
          ch = state.input.charCodeAt(++state.position);
        }

        if (allowComments && ch === 0x23/* # */) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
        }

        if (is_EOL(ch)) {
          readLineBreak(state);

          ch = state.input.charCodeAt(state.position);
          lineBreaks++;
          state.lineIndent = 0;

          while (ch === 0x20/* Space */) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
        } else {
          break;
        }
      }

      if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, 'deficient indentation');
      }

      return lineBreaks;
    }

    function testDocumentSeparator(state) {
      var _position = state.position,
          ch;

      ch = state.input.charCodeAt(_position);

      // Condition state.position === state.lineStart is tested
      // in parent on each call, for efficiency. No needs to test here again.
      if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
          ch === state.input.charCodeAt(_position + 1) &&
          ch === state.input.charCodeAt(_position + 2)) {

        _position += 3;

        ch = state.input.charCodeAt(_position);

        if (ch === 0 || is_WS_OR_EOL(ch)) {
          return true;
        }
      }

      return false;
    }

    function writeFoldedLines(state, count) {
      if (count === 1) {
        state.result += ' ';
      } else if (count > 1) {
        state.result += common.repeat('\n', count - 1);
      }
    }


    function readPlainScalar(state, nodeIndent, withinFlowCollection) {
      var preceding,
          following,
          captureStart,
          captureEnd,
          hasPendingContent,
          _line,
          _lineStart,
          _lineIndent,
          _kind = state.kind,
          _result = state.result,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (is_WS_OR_EOL(ch)      ||
          is_FLOW_INDICATOR(ch) ||
          ch === 0x23/* # */    ||
          ch === 0x26/* & */    ||
          ch === 0x2A/* * */    ||
          ch === 0x21/* ! */    ||
          ch === 0x7C/* | */    ||
          ch === 0x3E/* > */    ||
          ch === 0x27/* ' */    ||
          ch === 0x22/* " */    ||
          ch === 0x25/* % */    ||
          ch === 0x40/* @ */    ||
          ch === 0x60/* ` */) {
        return false;
      }

      if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
        following = state.input.charCodeAt(state.position + 1);

        if (is_WS_OR_EOL(following) ||
            withinFlowCollection && is_FLOW_INDICATOR(following)) {
          return false;
        }
      }

      state.kind = 'scalar';
      state.result = '';
      captureStart = captureEnd = state.position;
      hasPendingContent = false;

      while (ch !== 0) {
        if (ch === 0x3A/* : */) {
          following = state.input.charCodeAt(state.position + 1);

          if (is_WS_OR_EOL(following) ||
              withinFlowCollection && is_FLOW_INDICATOR(following)) {
            break;
          }

        } else if (ch === 0x23/* # */) {
          preceding = state.input.charCodeAt(state.position - 1);

          if (is_WS_OR_EOL(preceding)) {
            break;
          }

        } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
                   withinFlowCollection && is_FLOW_INDICATOR(ch)) {
          break;

        } else if (is_EOL(ch)) {
          _line = state.line;
          _lineStart = state.lineStart;
          _lineIndent = state.lineIndent;
          skipSeparationSpace(state, false, -1);

          if (state.lineIndent >= nodeIndent) {
            hasPendingContent = true;
            ch = state.input.charCodeAt(state.position);
            continue;
          } else {
            state.position = captureEnd;
            state.line = _line;
            state.lineStart = _lineStart;
            state.lineIndent = _lineIndent;
            break;
          }
        }

        if (hasPendingContent) {
          captureSegment(state, captureStart, captureEnd, false);
          writeFoldedLines(state, state.line - _line);
          captureStart = captureEnd = state.position;
          hasPendingContent = false;
        }

        if (!is_WHITE_SPACE(ch)) {
          captureEnd = state.position + 1;
        }

        ch = state.input.charCodeAt(++state.position);
      }

      captureSegment(state, captureStart, captureEnd, false);

      if (state.result) {
        return true;
      }

      state.kind = _kind;
      state.result = _result;
      return false;
    }

    function readSingleQuotedScalar(state, nodeIndent) {
      var ch,
          captureStart, captureEnd;

      ch = state.input.charCodeAt(state.position);

      if (ch !== 0x27/* ' */) {
        return false;
      }

      state.kind = 'scalar';
      state.result = '';
      state.position++;
      captureStart = captureEnd = state.position;

      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 0x27/* ' */) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);

          if (ch === 0x27/* ' */) {
            captureStart = state.position;
            state.position++;
            captureEnd = state.position;
          } else {
            return true;
          }

        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;

        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, 'unexpected end of the document within a single quoted scalar');

        } else {
          state.position++;
          captureEnd = state.position;
        }
      }

      throwError(state, 'unexpected end of the stream within a single quoted scalar');
    }

    function readDoubleQuotedScalar(state, nodeIndent) {
      var captureStart,
          captureEnd,
          hexLength,
          hexResult,
          tmp,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (ch !== 0x22/* " */) {
        return false;
      }

      state.kind = 'scalar';
      state.result = '';
      state.position++;
      captureStart = captureEnd = state.position;

      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 0x22/* " */) {
          captureSegment(state, captureStart, state.position, true);
          state.position++;
          return true;

        } else if (ch === 0x5C/* \ */) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);

          if (is_EOL(ch)) {
            skipSeparationSpace(state, false, nodeIndent);

            // TODO: rework to inline fn with no type cast?
          } else if (ch < 256 && simpleEscapeCheck[ch]) {
            state.result += simpleEscapeMap[ch];
            state.position++;

          } else if ((tmp = escapedHexLen(ch)) > 0) {
            hexLength = tmp;
            hexResult = 0;

            for (; hexLength > 0; hexLength--) {
              ch = state.input.charCodeAt(++state.position);

              if ((tmp = fromHexCode(ch)) >= 0) {
                hexResult = (hexResult << 4) + tmp;

              } else {
                throwError(state, 'expected hexadecimal character');
              }
            }

            state.result += charFromCodepoint(hexResult);

            state.position++;

          } else {
            throwError(state, 'unknown escape sequence');
          }

          captureStart = captureEnd = state.position;

        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;

        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, 'unexpected end of the document within a double quoted scalar');

        } else {
          state.position++;
          captureEnd = state.position;
        }
      }

      throwError(state, 'unexpected end of the stream within a double quoted scalar');
    }

    function readFlowCollection(state, nodeIndent) {
      var readNext = true,
          _line,
          _lineStart,
          _pos,
          _tag     = state.tag,
          _result,
          _anchor  = state.anchor,
          following,
          terminator,
          isPair,
          isExplicitPair,
          isMapping,
          overridableKeys = Object.create(null),
          keyNode,
          keyTag,
          valueNode,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (ch === 0x5B/* [ */) {
        terminator = 0x5D;/* ] */
        isMapping = false;
        _result = [];
      } else if (ch === 0x7B/* { */) {
        terminator = 0x7D;/* } */
        isMapping = true;
        _result = {};
      } else {
        return false;
      }

      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }

      ch = state.input.charCodeAt(++state.position);

      while (ch !== 0) {
        skipSeparationSpace(state, true, nodeIndent);

        ch = state.input.charCodeAt(state.position);

        if (ch === terminator) {
          state.position++;
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = isMapping ? 'mapping' : 'sequence';
          state.result = _result;
          return true;
        } else if (!readNext) {
          throwError(state, 'missed comma between flow collection entries');
        } else if (ch === 0x2C/* , */) {
          // "flow collection entries can never be completely empty", as per YAML 1.2, section 7.4
          throwError(state, "expected the node content, but found ','");
        }

        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;

        if (ch === 0x3F/* ? */) {
          following = state.input.charCodeAt(state.position + 1);

          if (is_WS_OR_EOL(following)) {
            isPair = isExplicitPair = true;
            state.position++;
            skipSeparationSpace(state, true, nodeIndent);
          }
        }

        _line = state.line; // Save the current line.
        _lineStart = state.lineStart;
        _pos = state.position;
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);

        ch = state.input.charCodeAt(state.position);

        if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
          isPair = true;
          ch = state.input.charCodeAt(++state.position);
          skipSeparationSpace(state, true, nodeIndent);
          composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
          valueNode = state.result;
        }

        if (isMapping) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
        } else if (isPair) {
          _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
        } else {
          _result.push(keyNode);
        }

        skipSeparationSpace(state, true, nodeIndent);

        ch = state.input.charCodeAt(state.position);

        if (ch === 0x2C/* , */) {
          readNext = true;
          ch = state.input.charCodeAt(++state.position);
        } else {
          readNext = false;
        }
      }

      throwError(state, 'unexpected end of the stream within a flow collection');
    }

    function readBlockScalar(state, nodeIndent) {
      var captureStart,
          folding,
          chomping       = CHOMPING_CLIP,
          didReadContent = false,
          detectedIndent = false,
          textIndent     = nodeIndent,
          emptyLines     = 0,
          atMoreIndented = false,
          tmp,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (ch === 0x7C/* | */) {
        folding = false;
      } else if (ch === 0x3E/* > */) {
        folding = true;
      } else {
        return false;
      }

      state.kind = 'scalar';
      state.result = '';

      while (ch !== 0) {
        ch = state.input.charCodeAt(++state.position);

        if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
          if (CHOMPING_CLIP === chomping) {
            chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
          } else {
            throwError(state, 'repeat of a chomping mode identifier');
          }

        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
          if (tmp === 0) {
            throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
          } else if (!detectedIndent) {
            textIndent = nodeIndent + tmp - 1;
            detectedIndent = true;
          } else {
            throwError(state, 'repeat of an indentation width identifier');
          }

        } else {
          break;
        }
      }

      if (is_WHITE_SPACE(ch)) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (is_WHITE_SPACE(ch));

        if (ch === 0x23/* # */) {
          do { ch = state.input.charCodeAt(++state.position); }
          while (!is_EOL(ch) && (ch !== 0));
        }
      }

      while (ch !== 0) {
        readLineBreak(state);
        state.lineIndent = 0;

        ch = state.input.charCodeAt(state.position);

        while ((!detectedIndent || state.lineIndent < textIndent) &&
               (ch === 0x20/* Space */)) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }

        if (!detectedIndent && state.lineIndent > textIndent) {
          textIndent = state.lineIndent;
        }

        if (is_EOL(ch)) {
          emptyLines++;
          continue;
        }

        // End of the scalar.
        if (state.lineIndent < textIndent) {

          // Perform the chomping.
          if (chomping === CHOMPING_KEEP) {
            state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
          } else if (chomping === CHOMPING_CLIP) {
            if (didReadContent) { // i.e. only if the scalar is not empty.
              state.result += '\n';
            }
          }

          // Break this `while` cycle and go to the funciton's epilogue.
          break;
        }

        // Folded style: use fancy rules to handle line breaks.
        if (folding) {

          // Lines starting with white space characters (more-indented lines) are not folded.
          if (is_WHITE_SPACE(ch)) {
            atMoreIndented = true;
            // except for the first content line (cf. Example 8.1)
            state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

          // End of more-indented block.
          } else if (atMoreIndented) {
            atMoreIndented = false;
            state.result += common.repeat('\n', emptyLines + 1);

          // Just one line break - perceive as the same line.
          } else if (emptyLines === 0) {
            if (didReadContent) { // i.e. only if we have already read some scalar content.
              state.result += ' ';
            }

          // Several line breaks - perceive as different lines.
          } else {
            state.result += common.repeat('\n', emptyLines);
          }

        // Literal style: just add exact number of line breaks between content lines.
        } else {
          // Keep all line breaks except the header line break.
          state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
        }

        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        captureStart = state.position;

        while (!is_EOL(ch) && (ch !== 0)) {
          ch = state.input.charCodeAt(++state.position);
        }

        captureSegment(state, captureStart, state.position, false);
      }

      return true;
    }

    function readBlockSequence(state, nodeIndent) {
      var _line,
          _tag      = state.tag,
          _anchor   = state.anchor,
          _result   = [],
          following,
          detected  = false,
          ch;

      // there is a leading tab before this token, so it can't be a block sequence/mapping;
      // it can still be flow sequence/mapping or a scalar
      if (state.firstTabInLine !== -1) return false;

      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }

      ch = state.input.charCodeAt(state.position);

      while (ch !== 0) {
        if (state.firstTabInLine !== -1) {
          state.position = state.firstTabInLine;
          throwError(state, 'tab characters must not be used in indentation');
        }

        if (ch !== 0x2D/* - */) {
          break;
        }

        following = state.input.charCodeAt(state.position + 1);

        if (!is_WS_OR_EOL(following)) {
          break;
        }

        detected = true;
        state.position++;

        if (skipSeparationSpace(state, true, -1)) {
          if (state.lineIndent <= nodeIndent) {
            _result.push(null);
            ch = state.input.charCodeAt(state.position);
            continue;
          }
        }

        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
        _result.push(state.result);
        skipSeparationSpace(state, true, -1);

        ch = state.input.charCodeAt(state.position);

        if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
          throwError(state, 'bad indentation of a sequence entry');
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }

      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = 'sequence';
        state.result = _result;
        return true;
      }
      return false;
    }

    function readBlockMapping(state, nodeIndent, flowIndent) {
      var following,
          allowCompact,
          _line,
          _keyLine,
          _keyLineStart,
          _keyPos,
          _tag          = state.tag,
          _anchor       = state.anchor,
          _result       = {},
          overridableKeys = Object.create(null),
          keyTag        = null,
          keyNode       = null,
          valueNode     = null,
          atExplicitKey = false,
          detected      = false,
          ch;

      // there is a leading tab before this token, so it can't be a block sequence/mapping;
      // it can still be flow sequence/mapping or a scalar
      if (state.firstTabInLine !== -1) return false;

      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }

      ch = state.input.charCodeAt(state.position);

      while (ch !== 0) {
        if (!atExplicitKey && state.firstTabInLine !== -1) {
          state.position = state.firstTabInLine;
          throwError(state, 'tab characters must not be used in indentation');
        }

        following = state.input.charCodeAt(state.position + 1);
        _line = state.line; // Save the current line.

        //
        // Explicit notation case. There are two separate blocks:
        // first for the key (denoted by "?") and second for the value (denoted by ":")
        //
        if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

          if (ch === 0x3F/* ? */) {
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }

            detected = true;
            atExplicitKey = true;
            allowCompact = true;

          } else if (atExplicitKey) {
            // i.e. 0x3A/* : */ === character after the explicit key.
            atExplicitKey = false;
            allowCompact = true;

          } else {
            throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
          }

          state.position += 1;
          ch = following;

        //
        // Implicit notation case. Flow-style node as the key first, then ":", and the value.
        //
        } else {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;

          if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
            // Neither implicit nor explicit notation.
            // Reading is done. Go to the epilogue.
            break;
          }

          if (state.line === _line) {
            ch = state.input.charCodeAt(state.position);

            while (is_WHITE_SPACE(ch)) {
              ch = state.input.charCodeAt(++state.position);
            }

            if (ch === 0x3A/* : */) {
              ch = state.input.charCodeAt(++state.position);

              if (!is_WS_OR_EOL(ch)) {
                throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
              }

              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
                keyTag = keyNode = valueNode = null;
              }

              detected = true;
              atExplicitKey = false;
              allowCompact = false;
              keyTag = state.tag;
              keyNode = state.result;

            } else if (detected) {
              throwError(state, 'can not read an implicit mapping pair; a colon is missed');

            } else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true; // Keep the result of `composeNode`.
            }

          } else if (detected) {
            throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true; // Keep the result of `composeNode`.
          }
        }

        //
        // Common reading code for both explicit and implicit notations.
        //
        if (state.line === _line || state.lineIndent > nodeIndent) {
          if (atExplicitKey) {
            _keyLine = state.line;
            _keyLineStart = state.lineStart;
            _keyPos = state.position;
          }

          if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
            if (atExplicitKey) {
              keyNode = state.result;
            } else {
              valueNode = state.result;
            }
          }

          if (!atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }

          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
        }

        if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
          throwError(state, 'bad indentation of a mapping entry');
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }

      //
      // Epilogue.
      //

      // Special case: last mapping's node contains only the key in explicit notation.
      if (atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
      }

      // Expose the resulting mapping.
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = 'mapping';
        state.result = _result;
      }

      return detected;
    }

    function readTagProperty(state) {
      var _position,
          isVerbatim = false,
          isNamed    = false,
          tagHandle,
          tagName,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (ch !== 0x21/* ! */) return false;

      if (state.tag !== null) {
        throwError(state, 'duplication of a tag property');
      }

      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x3C/* < */) {
        isVerbatim = true;
        ch = state.input.charCodeAt(++state.position);

      } else if (ch === 0x21/* ! */) {
        isNamed = true;
        tagHandle = '!!';
        ch = state.input.charCodeAt(++state.position);

      } else {
        tagHandle = '!';
      }

      _position = state.position;

      if (isVerbatim) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (ch !== 0 && ch !== 0x3E/* > */);

        if (state.position < state.length) {
          tagName = state.input.slice(_position, state.position);
          ch = state.input.charCodeAt(++state.position);
        } else {
          throwError(state, 'unexpected end of the stream within a verbatim tag');
        }
      } else {
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {

          if (ch === 0x21/* ! */) {
            if (!isNamed) {
              tagHandle = state.input.slice(_position - 1, state.position + 1);

              if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                throwError(state, 'named tag handle cannot contain such characters');
              }

              isNamed = true;
              _position = state.position + 1;
            } else {
              throwError(state, 'tag suffix cannot contain exclamation marks');
            }
          }

          ch = state.input.charCodeAt(++state.position);
        }

        tagName = state.input.slice(_position, state.position);

        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
          throwError(state, 'tag suffix cannot contain flow indicator characters');
        }
      }

      if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        throwError(state, 'tag name cannot contain such characters: ' + tagName);
      }

      try {
        tagName = decodeURIComponent(tagName);
      } catch (err) {
        throwError(state, 'tag name is malformed: ' + tagName);
      }

      if (isVerbatim) {
        state.tag = tagName;

      } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;

      } else if (tagHandle === '!') {
        state.tag = '!' + tagName;

      } else if (tagHandle === '!!') {
        state.tag = 'tag:yaml.org,2002:' + tagName;

      } else {
        throwError(state, 'undeclared tag handle "' + tagHandle + '"');
      }

      return true;
    }

    function readAnchorProperty(state) {
      var _position,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (ch !== 0x26/* & */) return false;

      if (state.anchor !== null) {
        throwError(state, 'duplication of an anchor property');
      }

      ch = state.input.charCodeAt(++state.position);
      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (state.position === _position) {
        throwError(state, 'name of an anchor node must contain at least one character');
      }

      state.anchor = state.input.slice(_position, state.position);
      return true;
    }

    function readAlias(state) {
      var _position, alias,
          ch;

      ch = state.input.charCodeAt(state.position);

      if (ch !== 0x2A/* * */) return false;

      ch = state.input.charCodeAt(++state.position);
      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (state.position === _position) {
        throwError(state, 'name of an alias node must contain at least one character');
      }

      alias = state.input.slice(_position, state.position);

      if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
        throwError(state, 'unidentified alias "' + alias + '"');
      }

      state.result = state.anchorMap[alias];
      skipSeparationSpace(state, true, -1);
      return true;
    }

    function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
      var allowBlockStyles,
          allowBlockScalars,
          allowBlockCollections,
          indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
          atNewLine  = false,
          hasContent = false,
          typeIndex,
          typeQuantity,
          typeList,
          type,
          flowIndent,
          blockIndent;

      if (state.listener !== null) {
        state.listener('open', state);
      }

      state.tag    = null;
      state.anchor = null;
      state.kind   = null;
      state.result = null;

      allowBlockStyles = allowBlockScalars = allowBlockCollections =
        CONTEXT_BLOCK_OUT === nodeContext ||
        CONTEXT_BLOCK_IN  === nodeContext;

      if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;

          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        }
      }

      if (indentStatus === 1) {
        while (readTagProperty(state) || readAnchorProperty(state)) {
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            allowBlockCollections = allowBlockStyles;

            if (state.lineIndent > parentIndent) {
              indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
              indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
              indentStatus = -1;
            }
          } else {
            allowBlockCollections = false;
          }
        }
      }

      if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
      }

      if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
          flowIndent = parentIndent;
        } else {
          flowIndent = parentIndent + 1;
        }

        blockIndent = state.position - state.lineStart;

        if (indentStatus === 1) {
          if (allowBlockCollections &&
              (readBlockSequence(state, blockIndent) ||
               readBlockMapping(state, blockIndent, flowIndent)) ||
              readFlowCollection(state, flowIndent)) {
            hasContent = true;
          } else {
            if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
                readSingleQuotedScalar(state, flowIndent) ||
                readDoubleQuotedScalar(state, flowIndent)) {
              hasContent = true;

            } else if (readAlias(state)) {
              hasContent = true;

              if (state.tag !== null || state.anchor !== null) {
                throwError(state, 'alias node should not have any properties');
              }

            } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
              hasContent = true;

              if (state.tag === null) {
                state.tag = '?';
              }
            }

            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else if (indentStatus === 0) {
          // Special case: block sequences are allowed to have same indentation level as the parent.
          // http://www.yaml.org/spec/1.2/spec.html#id2799784
          hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
      }

      if (state.tag === null) {
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }

      } else if (state.tag === '?') {
        // Implicit resolving is not allowed for non-scalar types, and '?'
        // non-specific tag is only automatically assigned to plain scalars.
        //
        // We only need to check kind conformity in case user explicitly assigns '?'
        // tag, for example like this: "!<?> [0]"
        //
        if (state.result !== null && state.kind !== 'scalar') {
          throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
        }

        for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
          type = state.implicitTypes[typeIndex];

          if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
            state.result = type.construct(state.result);
            state.tag = type.tag;
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
            break;
          }
        }
      } else if (state.tag !== '!') {
        if (_hasOwnProperty$1.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
          type = state.typeMap[state.kind || 'fallback'][state.tag];
        } else {
          // looking for multi type
          type = null;
          typeList = state.typeMap.multi[state.kind || 'fallback'];

          for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
            if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
              type = typeList[typeIndex];
              break;
            }
          }
        }

        if (!type) {
          throwError(state, 'unknown tag !<' + state.tag + '>');
        }

        if (state.result !== null && type.kind !== state.kind) {
          throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
        }

        if (!type.resolve(state.result, state.tag)) { // `state.result` updated in resolver if matched
          throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
        } else {
          state.result = type.construct(state.result, state.tag);
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      }

      if (state.listener !== null) {
        state.listener('close', state);
      }
      return state.tag !== null ||  state.anchor !== null || hasContent;
    }

    function readDocument(state) {
      var documentStart = state.position,
          _position,
          directiveName,
          directiveArgs,
          hasDirectives = false,
          ch;

      state.version = null;
      state.checkLineBreaks = state.legacy;
      state.tagMap = Object.create(null);
      state.anchorMap = Object.create(null);

      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        skipSeparationSpace(state, true, -1);

        ch = state.input.charCodeAt(state.position);

        if (state.lineIndent > 0 || ch !== 0x25/* % */) {
          break;
        }

        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        _position = state.position;

        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        directiveName = state.input.slice(_position, state.position);
        directiveArgs = [];

        if (directiveName.length < 1) {
          throwError(state, 'directive name must not be less than one character in length');
        }

        while (ch !== 0) {
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }

          if (ch === 0x23/* # */) {
            do { ch = state.input.charCodeAt(++state.position); }
            while (ch !== 0 && !is_EOL(ch));
            break;
          }

          if (is_EOL(ch)) break;

          _position = state.position;

          while (ch !== 0 && !is_WS_OR_EOL(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }

          directiveArgs.push(state.input.slice(_position, state.position));
        }

        if (ch !== 0) readLineBreak(state);

        if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
          directiveHandlers[directiveName](state, directiveName, directiveArgs);
        } else {
          throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
      }

      skipSeparationSpace(state, true, -1);

      if (state.lineIndent === 0 &&
          state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
          state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
          state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);

      } else if (hasDirectives) {
        throwError(state, 'directives end mark is expected');
      }

      composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
      skipSeparationSpace(state, true, -1);

      if (state.checkLineBreaks &&
          PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, 'non-ASCII line breaks are interpreted as content');
      }

      state.documents.push(state.result);

      if (state.position === state.lineStart && testDocumentSeparator(state)) {

        if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        }
        return;
      }

      if (state.position < (state.length - 1)) {
        throwError(state, 'end of the stream or a document separator is expected');
      } else {
        return;
      }
    }


    function loadDocuments(input, options) {
      input = String(input);
      options = options || {};

      if (input.length !== 0) {

        // Add tailing `\n` if not exists
        if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
            input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
          input += '\n';
        }

        // Strip BOM
        if (input.charCodeAt(0) === 0xFEFF) {
          input = input.slice(1);
        }
      }

      var state = new State$1(input, options);

      var nullpos = input.indexOf('\0');

      if (nullpos !== -1) {
        state.position = nullpos;
        throwError(state, 'null byte is not allowed in input');
      }

      // Use 0 as string terminator. That significantly simplifies bounds check.
      state.input += '\0';

      while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
        state.lineIndent += 1;
        state.position += 1;
      }

      while (state.position < (state.length - 1)) {
        readDocument(state);
      }

      return state.documents;
    }


    function loadAll$1(input, iterator, options) {
      if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
        options = iterator;
        iterator = null;
      }

      var documents = loadDocuments(input, options);

      if (typeof iterator !== 'function') {
        return documents;
      }

      for (var index = 0, length = documents.length; index < length; index += 1) {
        iterator(documents[index]);
      }
    }


    function load$1(input, options) {
      var documents = loadDocuments(input, options);

      if (documents.length === 0) {
        /*eslint-disable no-undefined*/
        return undefined;
      } else if (documents.length === 1) {
        return documents[0];
      }
      throw new exception('expected a single document in the stream, but found more');
    }


    var loadAll_1 = loadAll$1;
    var load_1    = load$1;

    var loader = {
    	loadAll: loadAll_1,
    	load: load_1
    };

    /*eslint-disable no-use-before-define*/





    var _toString       = Object.prototype.toString;
    var _hasOwnProperty = Object.prototype.hasOwnProperty;

    var CHAR_BOM                  = 0xFEFF;
    var CHAR_TAB                  = 0x09; /* Tab */
    var CHAR_LINE_FEED            = 0x0A; /* LF */
    var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
    var CHAR_SPACE                = 0x20; /* Space */
    var CHAR_EXCLAMATION          = 0x21; /* ! */
    var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
    var CHAR_SHARP                = 0x23; /* # */
    var CHAR_PERCENT              = 0x25; /* % */
    var CHAR_AMPERSAND            = 0x26; /* & */
    var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
    var CHAR_ASTERISK             = 0x2A; /* * */
    var CHAR_COMMA                = 0x2C; /* , */
    var CHAR_MINUS                = 0x2D; /* - */
    var CHAR_COLON                = 0x3A; /* : */
    var CHAR_EQUALS               = 0x3D; /* = */
    var CHAR_GREATER_THAN         = 0x3E; /* > */
    var CHAR_QUESTION             = 0x3F; /* ? */
    var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
    var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
    var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
    var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
    var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
    var CHAR_VERTICAL_LINE        = 0x7C; /* | */
    var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

    var ESCAPE_SEQUENCES = {};

    ESCAPE_SEQUENCES[0x00]   = '\\0';
    ESCAPE_SEQUENCES[0x07]   = '\\a';
    ESCAPE_SEQUENCES[0x08]   = '\\b';
    ESCAPE_SEQUENCES[0x09]   = '\\t';
    ESCAPE_SEQUENCES[0x0A]   = '\\n';
    ESCAPE_SEQUENCES[0x0B]   = '\\v';
    ESCAPE_SEQUENCES[0x0C]   = '\\f';
    ESCAPE_SEQUENCES[0x0D]   = '\\r';
    ESCAPE_SEQUENCES[0x1B]   = '\\e';
    ESCAPE_SEQUENCES[0x22]   = '\\"';
    ESCAPE_SEQUENCES[0x5C]   = '\\\\';
    ESCAPE_SEQUENCES[0x85]   = '\\N';
    ESCAPE_SEQUENCES[0xA0]   = '\\_';
    ESCAPE_SEQUENCES[0x2028] = '\\L';
    ESCAPE_SEQUENCES[0x2029] = '\\P';

    var DEPRECATED_BOOLEANS_SYNTAX = [
      'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
      'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
    ];

    var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;

    function compileStyleMap(schema, map) {
      var result, keys, index, length, tag, style, type;

      if (map === null) return {};

      result = {};
      keys = Object.keys(map);

      for (index = 0, length = keys.length; index < length; index += 1) {
        tag = keys[index];
        style = String(map[tag]);

        if (tag.slice(0, 2) === '!!') {
          tag = 'tag:yaml.org,2002:' + tag.slice(2);
        }
        type = schema.compiledTypeMap['fallback'][tag];

        if (type && _hasOwnProperty.call(type.styleAliases, style)) {
          style = type.styleAliases[style];
        }

        result[tag] = style;
      }

      return result;
    }

    function encodeHex(character) {
      var string, handle, length;

      string = character.toString(16).toUpperCase();

      if (character <= 0xFF) {
        handle = 'x';
        length = 2;
      } else if (character <= 0xFFFF) {
        handle = 'u';
        length = 4;
      } else if (character <= 0xFFFFFFFF) {
        handle = 'U';
        length = 8;
      } else {
        throw new exception('code point within a string may not be greater than 0xFFFFFFFF');
      }

      return '\\' + handle + common.repeat('0', length - string.length) + string;
    }


    var QUOTING_TYPE_SINGLE = 1,
        QUOTING_TYPE_DOUBLE = 2;

    function State(options) {
      this.schema        = options['schema'] || _default;
      this.indent        = Math.max(1, (options['indent'] || 2));
      this.noArrayIndent = options['noArrayIndent'] || false;
      this.skipInvalid   = options['skipInvalid'] || false;
      this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
      this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
      this.sortKeys      = options['sortKeys'] || false;
      this.lineWidth     = options['lineWidth'] || 80;
      this.noRefs        = options['noRefs'] || false;
      this.noCompatMode  = options['noCompatMode'] || false;
      this.condenseFlow  = options['condenseFlow'] || false;
      this.quotingType   = options['quotingType'] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
      this.forceQuotes   = options['forceQuotes'] || false;
      this.replacer      = typeof options['replacer'] === 'function' ? options['replacer'] : null;

      this.implicitTypes = this.schema.compiledImplicit;
      this.explicitTypes = this.schema.compiledExplicit;

      this.tag = null;
      this.result = '';

      this.duplicates = [];
      this.usedDuplicates = null;
    }

    // Indents every line in a string. Empty lines (\n only) are not indented.
    function indentString(string, spaces) {
      var ind = common.repeat(' ', spaces),
          position = 0,
          next = -1,
          result = '',
          line,
          length = string.length;

      while (position < length) {
        next = string.indexOf('\n', position);
        if (next === -1) {
          line = string.slice(position);
          position = length;
        } else {
          line = string.slice(position, next + 1);
          position = next + 1;
        }

        if (line.length && line !== '\n') result += ind;

        result += line;
      }

      return result;
    }

    function generateNextLine(state, level) {
      return '\n' + common.repeat(' ', state.indent * level);
    }

    function testImplicitResolving(state, str) {
      var index, length, type;

      for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
        type = state.implicitTypes[index];

        if (type.resolve(str)) {
          return true;
        }
      }

      return false;
    }

    // [33] s-white ::= s-space | s-tab
    function isWhitespace(c) {
      return c === CHAR_SPACE || c === CHAR_TAB;
    }

    // Returns true if the character can be printed without escaping.
    // From YAML 1.2: "any allowed characters known to be non-printable
    // should also be escaped. [However,] This isn’t mandatory"
    // Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
    function isPrintable(c) {
      return  (0x00020 <= c && c <= 0x00007E)
          || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
          || ((0x0E000 <= c && c <= 0x00FFFD) && c !== CHAR_BOM)
          ||  (0x10000 <= c && c <= 0x10FFFF);
    }

    // [34] ns-char ::= nb-char - s-white
    // [27] nb-char ::= c-printable - b-char - c-byte-order-mark
    // [26] b-char  ::= b-line-feed | b-carriage-return
    // Including s-white (for some reason, examples doesn't match specs in this aspect)
    // ns-char ::= c-printable - b-line-feed - b-carriage-return - c-byte-order-mark
    function isNsCharOrWhitespace(c) {
      return isPrintable(c)
        && c !== CHAR_BOM
        // - b-char
        && c !== CHAR_CARRIAGE_RETURN
        && c !== CHAR_LINE_FEED;
    }

    // [127]  ns-plain-safe(c) ::= c = flow-out  ⇒ ns-plain-safe-out
    //                             c = flow-in   ⇒ ns-plain-safe-in
    //                             c = block-key ⇒ ns-plain-safe-out
    //                             c = flow-key  ⇒ ns-plain-safe-in
    // [128] ns-plain-safe-out ::= ns-char
    // [129]  ns-plain-safe-in ::= ns-char - c-flow-indicator
    // [130]  ns-plain-char(c) ::=  ( ns-plain-safe(c) - “:” - “#” )
    //                            | ( /* An ns-char preceding */ “#” )
    //                            | ( “:” /* Followed by an ns-plain-safe(c) */ )
    function isPlainSafe(c, prev, inblock) {
      var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
      var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
      return (
        // ns-plain-safe
        inblock ? // c = flow-in
          cIsNsCharOrWhitespace
          : cIsNsCharOrWhitespace
            // - c-flow-indicator
            && c !== CHAR_COMMA
            && c !== CHAR_LEFT_SQUARE_BRACKET
            && c !== CHAR_RIGHT_SQUARE_BRACKET
            && c !== CHAR_LEFT_CURLY_BRACKET
            && c !== CHAR_RIGHT_CURLY_BRACKET
      )
        // ns-plain-char
        && c !== CHAR_SHARP // false on '#'
        && !(prev === CHAR_COLON && !cIsNsChar) // false on ': '
        || (isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP) // change to true on '[^ ]#'
        || (prev === CHAR_COLON && cIsNsChar); // change to true on ':[^ ]'
    }

    // Simplified test for values allowed as the first character in plain style.
    function isPlainSafeFirst(c) {
      // Uses a subset of ns-char - c-indicator
      // where ns-char = nb-char - s-white.
      // No support of ( ( “?” | “:” | “-” ) /* Followed by an ns-plain-safe(c)) */ ) part
      return isPrintable(c) && c !== CHAR_BOM
        && !isWhitespace(c) // - s-white
        // - (c-indicator ::=
        // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
        && c !== CHAR_MINUS
        && c !== CHAR_QUESTION
        && c !== CHAR_COLON
        && c !== CHAR_COMMA
        && c !== CHAR_LEFT_SQUARE_BRACKET
        && c !== CHAR_RIGHT_SQUARE_BRACKET
        && c !== CHAR_LEFT_CURLY_BRACKET
        && c !== CHAR_RIGHT_CURLY_BRACKET
        // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
        && c !== CHAR_SHARP
        && c !== CHAR_AMPERSAND
        && c !== CHAR_ASTERISK
        && c !== CHAR_EXCLAMATION
        && c !== CHAR_VERTICAL_LINE
        && c !== CHAR_EQUALS
        && c !== CHAR_GREATER_THAN
        && c !== CHAR_SINGLE_QUOTE
        && c !== CHAR_DOUBLE_QUOTE
        // | “%” | “@” | “`”)
        && c !== CHAR_PERCENT
        && c !== CHAR_COMMERCIAL_AT
        && c !== CHAR_GRAVE_ACCENT;
    }

    // Simplified test for values allowed as the last character in plain style.
    function isPlainSafeLast(c) {
      // just not whitespace or colon, it will be checked to be plain character later
      return !isWhitespace(c) && c !== CHAR_COLON;
    }

    // Same as 'string'.codePointAt(pos), but works in older browsers.
    function codePointAt(string, pos) {
      var first = string.charCodeAt(pos), second;
      if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < string.length) {
        second = string.charCodeAt(pos + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
          // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
        }
      }
      return first;
    }

    // Determines whether block indentation indicator is required.
    function needIndentIndicator(string) {
      var leadingSpaceRe = /^\n* /;
      return leadingSpaceRe.test(string);
    }

    var STYLE_PLAIN   = 1,
        STYLE_SINGLE  = 2,
        STYLE_LITERAL = 3,
        STYLE_FOLDED  = 4,
        STYLE_DOUBLE  = 5;

    // Determines which scalar styles are possible and returns the preferred style.
    // lineWidth = -1 => no limit.
    // Pre-conditions: str.length > 0.
    // Post-conditions:
    //    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
    //    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
    //    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
    function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth,
      testAmbiguousType, quotingType, forceQuotes, inblock) {

      var i;
      var char = 0;
      var prevChar = null;
      var hasLineBreak = false;
      var hasFoldableLine = false; // only checked if shouldTrackWidth
      var shouldTrackWidth = lineWidth !== -1;
      var previousLineBreak = -1; // count the first line correctly
      var plain = isPlainSafeFirst(codePointAt(string, 0))
              && isPlainSafeLast(codePointAt(string, string.length - 1));

      if (singleLineOnly || forceQuotes) {
        // Case: no block styles.
        // Check for disallowed characters to rule out plain and single.
        for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
          char = codePointAt(string, i);
          if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          plain = plain && isPlainSafe(char, prevChar, inblock);
          prevChar = char;
        }
      } else {
        // Case: block styles permitted.
        for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
          char = codePointAt(string, i);
          if (char === CHAR_LINE_FEED) {
            hasLineBreak = true;
            // Check if any line can be folded.
            if (shouldTrackWidth) {
              hasFoldableLine = hasFoldableLine ||
                // Foldable line = too long, and not more-indented.
                (i - previousLineBreak - 1 > lineWidth &&
                 string[previousLineBreak + 1] !== ' ');
              previousLineBreak = i;
            }
          } else if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          plain = plain && isPlainSafe(char, prevChar, inblock);
          prevChar = char;
        }
        // in case the end is missing a \n
        hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
          (i - previousLineBreak - 1 > lineWidth &&
           string[previousLineBreak + 1] !== ' '));
      }
      // Although every style can represent \n without escaping, prefer block styles
      // for multiline, since they're more readable and they don't add empty lines.
      // Also prefer folding a super-long line.
      if (!hasLineBreak && !hasFoldableLine) {
        // Strings interpretable as another type have to be quoted;
        // e.g. the string 'true' vs. the boolean true.
        if (plain && !forceQuotes && !testAmbiguousType(string)) {
          return STYLE_PLAIN;
        }
        return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
      }
      // Edge case: block indentation indicator can only have one digit.
      if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
      }
      // At this point we know block styles are valid.
      // Prefer literal style unless we want to fold.
      if (!forceQuotes) {
        return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }

    // Note: line breaking/folding is implemented for only the folded style.
    // NB. We drop the last trailing newline (if any) of a returned block scalar
    //  since the dumper adds its own newline. This always works:
    //    • No ending newline => unaffected; already using strip "-" chomping.
    //    • Ending newline    => removed then restored.
    //  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
    function writeScalar(state, string, level, iskey, inblock) {
      state.dump = (function () {
        if (string.length === 0) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
        }
        if (!state.noCompatMode) {
          if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
            return state.quotingType === QUOTING_TYPE_DOUBLE ? ('"' + string + '"') : ("'" + string + "'");
          }
        }

        var indent = state.indent * Math.max(1, level); // no 0-indent scalars
        // As indentation gets deeper, let the width decrease monotonically
        // to the lower bound min(state.lineWidth, 40).
        // Note that this implies
        //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
        //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
        // This behaves better than a constant minimum width which disallows narrower options,
        // or an indent threshold which causes the width to suddenly increase.
        var lineWidth = state.lineWidth === -1
          ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

        // Without knowing if keys are implicit/explicit, assume implicit for safety.
        var singleLineOnly = iskey
          // No block styles in flow mode.
          || (state.flowLevel > -1 && level >= state.flowLevel);
        function testAmbiguity(string) {
          return testImplicitResolving(state, string);
        }

        switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth,
          testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {

          case STYLE_PLAIN:
            return string;
          case STYLE_SINGLE:
            return "'" + string.replace(/'/g, "''") + "'";
          case STYLE_LITERAL:
            return '|' + blockHeader(string, state.indent)
              + dropEndingNewline(indentString(string, indent));
          case STYLE_FOLDED:
            return '>' + blockHeader(string, state.indent)
              + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
          case STYLE_DOUBLE:
            return '"' + escapeString(string) + '"';
          default:
            throw new exception('impossible error: invalid scalar style');
        }
      }());
    }

    // Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
    function blockHeader(string, indentPerLevel) {
      var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

      // note the special case: the string '\n' counts as a "trailing" empty line.
      var clip =          string[string.length - 1] === '\n';
      var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
      var chomp = keep ? '+' : (clip ? '' : '-');

      return indentIndicator + chomp + '\n';
    }

    // (See the note for writeScalar.)
    function dropEndingNewline(string) {
      return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
    }

    // Note: a long line without a suitable break point will exceed the width limit.
    // Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
    function foldString(string, width) {
      // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
      // unless they're before or after a more-indented line, or at the very
      // beginning or end, in which case $k$ maps to $k$.
      // Therefore, parse each chunk as newline(s) followed by a content line.
      var lineRe = /(\n+)([^\n]*)/g;

      // first line (possibly an empty line)
      var result = (function () {
        var nextLF = string.indexOf('\n');
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
      }());
      // If we haven't reached the first content line yet, don't add an extra \n.
      var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
      var moreIndented;

      // rest of the lines
      var match;
      while ((match = lineRe.exec(string))) {
        var prefix = match[1], line = match[2];
        moreIndented = (line[0] === ' ');
        result += prefix
          + (!prevMoreIndented && !moreIndented && line !== ''
            ? '\n' : '')
          + foldLine(line, width);
        prevMoreIndented = moreIndented;
      }

      return result;
    }

    // Greedy line breaking.
    // Picks the longest line under the limit each time,
    // otherwise settles for the shortest line over the limit.
    // NB. More-indented lines *cannot* be folded, as that would add an extra \n.
    function foldLine(line, width) {
      if (line === '' || line[0] === ' ') return line;

      // Since a more-indented line adds a \n, breaks can't be followed by a space.
      var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
      var match;
      // start is an inclusive index. end, curr, and next are exclusive.
      var start = 0, end, curr = 0, next = 0;
      var result = '';

      // Invariants: 0 <= start <= length-1.
      //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
      // Inside the loop:
      //   A match implies length >= 2, so curr and next are <= length-2.
      while ((match = breakRe.exec(line))) {
        next = match.index;
        // maintain invariant: curr - start <= width
        if (next - start > width) {
          end = (curr > start) ? curr : next; // derive end <= length-2
          result += '\n' + line.slice(start, end);
          // skip the space that was output as \n
          start = end + 1;                    // derive start <= length-1
        }
        curr = next;
      }

      // By the invariants, start <= length-1, so there is something left over.
      // It is either the whole string or a part starting from non-whitespace.
      result += '\n';
      // Insert a break if the remainder is too long and there is a break available.
      if (line.length - start > width && curr > start) {
        result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
      } else {
        result += line.slice(start);
      }

      return result.slice(1); // drop extra \n joiner
    }

    // Escapes a double-quoted string.
    function escapeString(string) {
      var result = '';
      var char = 0;
      var escapeSeq;

      for (var i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
        char = codePointAt(string, i);
        escapeSeq = ESCAPE_SEQUENCES[char];

        if (!escapeSeq && isPrintable(char)) {
          result += string[i];
          if (char >= 0x10000) result += string[i + 1];
        } else {
          result += escapeSeq || encodeHex(char);
        }
      }

      return result;
    }

    function writeFlowSequence(state, level, object) {
      var _result = '',
          _tag    = state.tag,
          index,
          length,
          value;

      for (index = 0, length = object.length; index < length; index += 1) {
        value = object[index];

        if (state.replacer) {
          value = state.replacer.call(object, String(index), value);
        }

        // Write only valid elements, put null instead of invalid elements.
        if (writeNode(state, level, value, false, false) ||
            (typeof value === 'undefined' &&
             writeNode(state, level, null, false, false))) {

          if (_result !== '') _result += ',' + (!state.condenseFlow ? ' ' : '');
          _result += state.dump;
        }
      }

      state.tag = _tag;
      state.dump = '[' + _result + ']';
    }

    function writeBlockSequence(state, level, object, compact) {
      var _result = '',
          _tag    = state.tag,
          index,
          length,
          value;

      for (index = 0, length = object.length; index < length; index += 1) {
        value = object[index];

        if (state.replacer) {
          value = state.replacer.call(object, String(index), value);
        }

        // Write only valid elements, put null instead of invalid elements.
        if (writeNode(state, level + 1, value, true, true, false, true) ||
            (typeof value === 'undefined' &&
             writeNode(state, level + 1, null, true, true, false, true))) {

          if (!compact || _result !== '') {
            _result += generateNextLine(state, level);
          }

          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            _result += '-';
          } else {
            _result += '- ';
          }

          _result += state.dump;
        }
      }

      state.tag = _tag;
      state.dump = _result || '[]'; // Empty sequence if no valid values.
    }

    function writeFlowMapping(state, level, object) {
      var _result       = '',
          _tag          = state.tag,
          objectKeyList = Object.keys(object),
          index,
          length,
          objectKey,
          objectValue,
          pairBuffer;

      for (index = 0, length = objectKeyList.length; index < length; index += 1) {

        pairBuffer = '';
        if (_result !== '') pairBuffer += ', ';

        if (state.condenseFlow) pairBuffer += '"';

        objectKey = objectKeyList[index];
        objectValue = object[objectKey];

        if (state.replacer) {
          objectValue = state.replacer.call(object, objectKey, objectValue);
        }

        if (!writeNode(state, level, objectKey, false, false)) {
          continue; // Skip this pair because of invalid key;
        }

        if (state.dump.length > 1024) pairBuffer += '? ';

        pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

        if (!writeNode(state, level, objectValue, false, false)) {
          continue; // Skip this pair because of invalid value.
        }

        pairBuffer += state.dump;

        // Both key and value are valid.
        _result += pairBuffer;
      }

      state.tag = _tag;
      state.dump = '{' + _result + '}';
    }

    function writeBlockMapping(state, level, object, compact) {
      var _result       = '',
          _tag          = state.tag,
          objectKeyList = Object.keys(object),
          index,
          length,
          objectKey,
          objectValue,
          explicitPair,
          pairBuffer;

      // Allow sorting keys so that the output file is deterministic
      if (state.sortKeys === true) {
        // Default sorting
        objectKeyList.sort();
      } else if (typeof state.sortKeys === 'function') {
        // Custom sort function
        objectKeyList.sort(state.sortKeys);
      } else if (state.sortKeys) {
        // Something is wrong
        throw new exception('sortKeys must be a boolean or a function');
      }

      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = '';

        if (!compact || _result !== '') {
          pairBuffer += generateNextLine(state, level);
        }

        objectKey = objectKeyList[index];
        objectValue = object[objectKey];

        if (state.replacer) {
          objectValue = state.replacer.call(object, objectKey, objectValue);
        }

        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
          continue; // Skip this pair because of invalid key.
        }

        explicitPair = (state.tag !== null && state.tag !== '?') ||
                       (state.dump && state.dump.length > 1024);

        if (explicitPair) {
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += '?';
          } else {
            pairBuffer += '? ';
          }
        }

        pairBuffer += state.dump;

        if (explicitPair) {
          pairBuffer += generateNextLine(state, level);
        }

        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
          continue; // Skip this pair because of invalid value.
        }

        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += ':';
        } else {
          pairBuffer += ': ';
        }

        pairBuffer += state.dump;

        // Both key and value are valid.
        _result += pairBuffer;
      }

      state.tag = _tag;
      state.dump = _result || '{}'; // Empty mapping if no valid pairs.
    }

    function detectType(state, object, explicit) {
      var _result, typeList, index, length, type, style;

      typeList = explicit ? state.explicitTypes : state.implicitTypes;

      for (index = 0, length = typeList.length; index < length; index += 1) {
        type = typeList[index];

        if ((type.instanceOf  || type.predicate) &&
            (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
            (!type.predicate  || type.predicate(object))) {

          if (explicit) {
            if (type.multi && type.representName) {
              state.tag = type.representName(object);
            } else {
              state.tag = type.tag;
            }
          } else {
            state.tag = '?';
          }

          if (type.represent) {
            style = state.styleMap[type.tag] || type.defaultStyle;

            if (_toString.call(type.represent) === '[object Function]') {
              _result = type.represent(object, style);
            } else if (_hasOwnProperty.call(type.represent, style)) {
              _result = type.represent[style](object, style);
            } else {
              throw new exception('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
            }

            state.dump = _result;
          }

          return true;
        }
      }

      return false;
    }

    // Serializes `object` and writes it to global `result`.
    // Returns true on success, or false on invalid object.
    //
    function writeNode(state, level, object, block, compact, iskey, isblockseq) {
      state.tag = null;
      state.dump = object;

      if (!detectType(state, object, false)) {
        detectType(state, object, true);
      }

      var type = _toString.call(state.dump);
      var inblock = block;
      var tagStr;

      if (block) {
        block = (state.flowLevel < 0 || state.flowLevel > level);
      }

      var objectOrArray = type === '[object Object]' || type === '[object Array]',
          duplicateIndex,
          duplicate;

      if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
      }

      if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
        compact = false;
      }

      if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = '*ref_' + duplicateIndex;
      } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
          state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === '[object Object]') {
          if (block && (Object.keys(state.dump).length !== 0)) {
            writeBlockMapping(state, level, state.dump, compact);
            if (duplicate) {
              state.dump = '&ref_' + duplicateIndex + state.dump;
            }
          } else {
            writeFlowMapping(state, level, state.dump);
            if (duplicate) {
              state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
            }
          }
        } else if (type === '[object Array]') {
          if (block && (state.dump.length !== 0)) {
            if (state.noArrayIndent && !isblockseq && level > 0) {
              writeBlockSequence(state, level - 1, state.dump, compact);
            } else {
              writeBlockSequence(state, level, state.dump, compact);
            }
            if (duplicate) {
              state.dump = '&ref_' + duplicateIndex + state.dump;
            }
          } else {
            writeFlowSequence(state, level, state.dump);
            if (duplicate) {
              state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
            }
          }
        } else if (type === '[object String]') {
          if (state.tag !== '?') {
            writeScalar(state, state.dump, level, iskey, inblock);
          }
        } else if (type === '[object Undefined]') {
          return false;
        } else {
          if (state.skipInvalid) return false;
          throw new exception('unacceptable kind of an object to dump ' + type);
        }

        if (state.tag !== null && state.tag !== '?') {
          // Need to encode all characters except those allowed by the spec:
          //
          // [35] ns-dec-digit    ::=  [#x30-#x39] /* 0-9 */
          // [36] ns-hex-digit    ::=  ns-dec-digit
          //                         | [#x41-#x46] /* A-F */ | [#x61-#x66] /* a-f */
          // [37] ns-ascii-letter ::=  [#x41-#x5A] /* A-Z */ | [#x61-#x7A] /* a-z */
          // [38] ns-word-char    ::=  ns-dec-digit | ns-ascii-letter | “-”
          // [39] ns-uri-char     ::=  “%” ns-hex-digit ns-hex-digit | ns-word-char | “#”
          //                         | “;” | “/” | “?” | “:” | “@” | “&” | “=” | “+” | “$” | “,”
          //                         | “_” | “.” | “!” | “~” | “*” | “'” | “(” | “)” | “[” | “]”
          //
          // Also need to encode '!' because it has special meaning (end of tag prefix).
          //
          tagStr = encodeURI(
            state.tag[0] === '!' ? state.tag.slice(1) : state.tag
          ).replace(/!/g, '%21');

          if (state.tag[0] === '!') {
            tagStr = '!' + tagStr;
          } else if (tagStr.slice(0, 18) === 'tag:yaml.org,2002:') {
            tagStr = '!!' + tagStr.slice(18);
          } else {
            tagStr = '!<' + tagStr + '>';
          }

          state.dump = tagStr + ' ' + state.dump;
        }
      }

      return true;
    }

    function getDuplicateReferences(object, state) {
      var objects = [],
          duplicatesIndexes = [],
          index,
          length;

      inspectNode(object, objects, duplicatesIndexes);

      for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index]]);
      }
      state.usedDuplicates = new Array(length);
    }

    function inspectNode(object, objects, duplicatesIndexes) {
      var objectKeyList,
          index,
          length;

      if (object !== null && typeof object === 'object') {
        index = objects.indexOf(object);
        if (index !== -1) {
          if (duplicatesIndexes.indexOf(index) === -1) {
            duplicatesIndexes.push(index);
          }
        } else {
          objects.push(object);

          if (Array.isArray(object)) {
            for (index = 0, length = object.length; index < length; index += 1) {
              inspectNode(object[index], objects, duplicatesIndexes);
            }
          } else {
            objectKeyList = Object.keys(object);

            for (index = 0, length = objectKeyList.length; index < length; index += 1) {
              inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
            }
          }
        }
      }
    }

    function dump$1(input, options) {
      options = options || {};

      var state = new State(options);

      if (!state.noRefs) getDuplicateReferences(input, state);

      var value = input;

      if (state.replacer) {
        value = state.replacer.call({ '': value }, '', value);
      }

      if (writeNode(state, 0, value, true, true)) return state.dump + '\n';

      return '';
    }

    var dump_1 = dump$1;

    var dumper = {
    	dump: dump_1
    };

    function renamed(from, to) {
      return function () {
        throw new Error('Function yaml.' + from + ' is removed in js-yaml 4. ' +
          'Use yaml.' + to + ' instead, which is now safe by default.');
      };
    }


    var Type                = type;
    var Schema              = schema;
    var FAILSAFE_SCHEMA     = failsafe;
    var JSON_SCHEMA         = json;
    var CORE_SCHEMA         = core;
    var DEFAULT_SCHEMA      = _default;
    var load                = loader.load;
    var loadAll             = loader.loadAll;
    var dump                = dumper.dump;
    var YAMLException       = exception;

    // Re-export all types in case user wants to create custom schema
    var types = {
      binary:    binary,
      float:     float,
      map:       map,
      null:      _null,
      pairs:     pairs,
      set:       set,
      timestamp: timestamp,
      bool:      bool,
      int:       int,
      merge:     merge,
      omap:      omap,
      seq:       seq,
      str:       str
    };

    // Removed functions from JS-YAML 3.0.x
    var safeLoad            = renamed('safeLoad', 'load');
    var safeLoadAll         = renamed('safeLoadAll', 'loadAll');
    var safeDump            = renamed('safeDump', 'dump');

    var jsYaml = {
    	Type: Type,
    	Schema: Schema,
    	FAILSAFE_SCHEMA: FAILSAFE_SCHEMA,
    	JSON_SCHEMA: JSON_SCHEMA,
    	CORE_SCHEMA: CORE_SCHEMA,
    	DEFAULT_SCHEMA: DEFAULT_SCHEMA,
    	load: load,
    	loadAll: loadAll,
    	dump: dump,
    	YAMLException: YAMLException,
    	types: types,
    	safeLoad: safeLoad,
    	safeLoadAll: safeLoadAll,
    	safeDump: safeDump
    };

    function send({method, path, data, token}) {
      const fetch = window.fetch;

      const opts = {method, headers: {}};

      if (data) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(data);
      }

      if (token) {
        opts.headers['Authorization'] = `Token ${token}`;
      }

      return fetch(`${path}`, opts)
        .then(r => r.text())
        .then(json => {
          try {
            return JSON.parse(json);
          } catch (err) {
            return json;
          }
        });
    }

    function get(path, token) {
      return send({method: 'GET', path, token});
    }

    function del(path, token) {
      return send({method: 'DELETE', path, token});
    }

    function post(path, data, token) {
      return send({method: 'POST', path, data, token});
    }

    function put(path, data, token) {
      return send({method: 'PUT', path, data, token});
    }

    var api = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get: get,
        del: del,
        post: post,
        put: put
    });

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const SETTINGS = 'devtools-settings';
    const DEVTOOLS_THEME = 'devtools-theme';
    const DEVTOOLS_FONT = 'devtools-font';
    const DEVTOOLS_SIZE = 'devtools-size';
    const DEVTOOLS_CURRENT = 'devtools-current';
    const DEVTOOLS_ACCENT_COLOR = 'devtools-accent-color';

    const chromeStorage = chrome.storage && chrome.storage.sync;
    const fakeStorage = {

      async get(property, fn = () => {}) {
        let item = await localStorage.getItem(SETTINGS);
        try {
          const settings = item ? JSON.parse(item) : {};
          fn(settings);
        } catch (e) {
          fn({});
        }
      },

      set(settings, fn = () => {}) {
        let oldItem = localStorage.getItem(SETTINGS) || '{}';
        try {
          const oldSettings = JSON.parse(oldItem);
          const newSettings = {...oldSettings, ...settings};

          if (chromeStorage) {
            chromeStorage.set({[SETTINGS]: JSON.stringify(newSettings)}, () => {});
          }
          localStorage.setItem(SETTINGS, JSON.stringify(newSettings));
          fn(settings);
        } catch (e) {
          fn({});
        }
      },
    };

    // export const storage = chrome.storage.sync;
    const storage = fakeStorage;

    /**
     * @typedef Theme {object}
     * @property {string} name
     * @property {string} className
     * @property {string} description
     * @property {boolean} dark
     * @property {Theme} colors
     */
    class App$1 {
      constructor(data) {
        /**
         * The current theme
         * @type {?Theme}
         * @private
         */
        this._currentTheme = null;
        /**
         * The current theme name
         * @type {null}
         * @private
         */
        this._currentThemeName = null;
        /**
         * The current font size
         * @type {?number}
         * @private
         */
        this._currentFontSize = null;
        /**
         * The current font family
         * @type {?string}
         * @private
         */
        this._currentFontFamily = null;
        /**
         * The custom accent color
         *
         * @type {?string}
         * @private
         */
        this._currentAccentColor = null;

        /**
         * List of available themes
         * @type {Theme[]}
         */
        this.themes = [];
        /**
         * Loading state
         * @type {boolean}
         */
        this.loading = true;
        /**
         * Whether the notification should be available
         * @type {boolean}
         */
        this.notifying = false;

        this.defaults = {
          fontSize: 11,
          fontFamily: 'Menlo',
        };

        // Import data
        Object.assign(this, data);
      }

      loadDefaults() {
        if (!this.currentTheme) {
          this.currentTheme = this.themes[0];
        }
        if (!this.currentFontFamily) {
          this.currentFontFamily = this.defaults.fontFamily;
        }
        if (!this.currentFontSize) {
          this.currentFontSize = this.defaults.fontSize;
        }
      }

      /**
       * Returns the current theme
       * @returns {?Theme}
       */
      get currentTheme() {
        return this._currentTheme;
      }

      /**
       * Sets the current theme
       * @param {Theme} value
       */
      set currentTheme(value) {
        if (value) {
          // Simulate changing colors
          this._currentTheme = {
            ...value,
            colors: {},
          };

          this.saveCurrent(value);

          app$1.update($app => new App$1({...$app, _currentTheme: {...value}}));
        }
      }

      /**
       * Retrieve the current theme
       * @returns {null}
       */
      get currentThemeName() {
        return this._currentThemeName;
      }

      /**
       * Change the current theme name and current theme
       * @param name
       */
      set currentThemeName(name) {
        this._notify(this._currentTheme, name);
        this._currentThemeName = name;
        this.saveTheme(name);

        // Find and set current theme
        this.currentTheme = this.getTheme(name);
      }

      /**
       * Returns the current font size
       * @returns {?number}
       */
      get currentFontSize() {
        return this._currentFontSize;
      }

      /**
       * Sets the current font size
       * @param {number} value
       */
      set currentFontSize(value) {
        this._notify(this._currentFontSize, value);
        this._currentFontSize = value;
        this.saveFontSize(value);
      }

      /**
       * Returns the current font family
       * @returns {?string}
       */
      get currentFontFamily() {
        return this._currentFontFamily;
      }

      /**
       * Sets the current font family
       * @param {string} value
       */
      set currentFontFamily(value) {
        this._notify(this._currentFontFamily, value);
        this._currentFontFamily = value;
        this.saveFontFamily(value);
      }

      /**
       * Returns the current font family
       * @returns {?string}
       */
      get currentAccentColor() {
        return this._currentAccentColor;
      }

      /**
       * Sets the current font family
       * @param {string} value
       */
      set currentAccentColor(value) {
        this._notify(this._currentAccentColor, value);
        this._currentAccentColor = value;
        this.saveAccentColor(value);
      }

      loadThemes(themes) {
        this.themes = themes.map(theme => {
          return {
            name: theme.name,
            className: theme.className,
            description: theme.description,
            dark: theme.dark,
            colors: theme,
            accent: theme.accent,
          };
        });
      }

      /**
       * Find a theme by name
       * @param {string} name
       * @returns {?Theme}
       */
      getTheme(name = '') {
        return this.themes.find((theme) => theme.name === name);
      }

      /**
       * Save selected theme
       * @param {string} name
       */
      saveTheme(name) {
        storage.set({[DEVTOOLS_THEME]: name}, () => {
          if (chrome && chrome.browserAction) {
            chrome.browserAction.setIcon({
              path: `/public/icons/${name}.svg`,
            });
            chrome.browserAction.setTitle({
              title: `Material Theme Devtools - ${name}`,
            });
          }
        });
      }

      /**
       * Save selected font family
       * @param {string} family
       */
      saveFontFamily(family) {
        storage.set({[DEVTOOLS_FONT]: family}, () => {});
      }

      /**
       * Save selected font size
       * @param {number} size
       */
      saveFontSize(size) {
        storage.set({[DEVTOOLS_SIZE]: size}, () => {});
      }

      /**
       * Save current theme
       * @param theme
       */
      saveCurrent(theme) {
        storage.set({[DEVTOOLS_CURRENT]: theme}, () => {});
      }

      /**
       * Save current theme
       * @param color {string}
       */
      saveAccentColor(color) {
        storage.set({[DEVTOOLS_ACCENT_COLOR]: color}, () => {});
      }

      /**
       * Fetch settings
       */
      fetchSettings() {
        /** Get current theme setting from storage */
        return storage.get(SETTINGS, object => {
          this._currentThemeName = object[DEVTOOLS_THEME] || this.defaults.themeName;
          this._currentFontFamily = object[DEVTOOLS_FONT] || this.defaults.fontFamily;
          this._currentFontSize = object[DEVTOOLS_SIZE] || this.defaults.fontSize;
          this._currentAccentColor = object[DEVTOOLS_ACCENT_COLOR] || null;
          this.currentTheme = this.getTheme(this._currentThemeName || 'Material Oceanic');
        });

      }

      /**
       * Reset accent color
       */
      resetAccent() {
        this.currentAccentColor = null;
      }

      /**
       * Trigger a notification by setting a notify flag if the value changes
       * @param oldValue
       * @param newValue
       * @private
       */
      _notify(oldValue, newValue) {
        if (oldValue && oldValue !== newValue) {
          this.notifying = true;
          setTimeout(this._clearNotify, 5000);
        }
      }

      /**
       * Clear the notification state by unsetting a flag
       * @param _
       * @private
       */
      _clearNotify(_) {
        return app$1.update(app => new App$1({...app, notifying: false}));
      }
    }

    const app$1 = writable(new App$1());

    /* src/components/Footer.svelte generated by Svelte v3.38.2 */

    const file$8 = "src/components/Footer.svelte";

    function add_css$8() {
    	var style = element("style");
    	style.id = "svelte-1s2v8z2-style";
    	style.textContent = ".footer.svelte-1s2v8z2.svelte-1s2v8z2{grid-area:footer;text-align:right}.footer.svelte-1s2v8z2 a.svelte-1s2v8z2{text-decoration:none;color:var(--links)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRm9vdGVyLnN2ZWx0ZSIsInNvdXJjZXMiOlsiRm9vdGVyLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c3R5bGU+XG4gIC5mb290ZXIge1xuICAgIGdyaWQtYXJlYTogZm9vdGVyO1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICB9XG5cbiAgLmZvb3RlciBhIHtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgY29sb3I6IHZhcigtLWxpbmtzKTtcbiAgfVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cImZvb3RlclwiPlxuICAgIDxzbWFsbD5NYXRlcmlhbCBUaGVtZSDCqVxuICAgICAgICAyMDE1LTIwMjEgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cImh0dHBzOi8vd3d3Lm1hdGVyaWFsLXRoZW1lLmNvbVwiPkVsaW9yIEJvdWtob2J6YSAmIEpvbmFzXG4gICAgICAgICAgICBBdWdzYnVyZ2VyPC9hPjwvc21hbGw+XG4gICAgLVxuICAgIDxzbWFsbD5PcmlnaW5hbCBjb25jZXB0IGZyb20gPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS9taWNqYW1raW5nXCI+TWlrZSBLaW5nPC9hPjwvc21hbGw+XG48L2Rpdj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0UsT0FBTyw4QkFBQyxDQUFDLEFBQ1AsU0FBUyxDQUFFLE1BQU0sQ0FDakIsVUFBVSxDQUFFLEtBQUssQUFDbkIsQ0FBQyxBQUVELHNCQUFPLENBQUMsQ0FBQyxlQUFDLENBQUMsQUFDVCxlQUFlLENBQUUsSUFBSSxDQUNyQixLQUFLLENBQUUsSUFBSSxPQUFPLENBQUMsQUFDckIsQ0FBQyJ9 */";
    	append_dev(document.head, style);
    }

    function create_fragment$8(ctx) {
    	let div;
    	let small0;
    	let t0;
    	let a0;
    	let t1;
    	let t2;
    	let small1;
    	let t3;
    	let a1;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			small0 = element("small");
    			t0 = text("Material Theme ©\n        2015-2021 ");
    			a0 = element("a");
    			t1 = text("Elior Boukhobza & Jonas\n            Augsburger");
    			t2 = text("\n    -\n    ");
    			small1 = element("small");
    			t3 = text("Original concept from ");
    			a1 = element("a");
    			t4 = text("Mike King");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			small0 = claim_element(div_nodes, "SMALL", {});
    			var small0_nodes = children(small0);
    			t0 = claim_text(small0_nodes, "Material Theme ©\n        2015-2021 ");
    			a0 = claim_element(small0_nodes, "A", { target: true, href: true, class: true });
    			var a0_nodes = children(a0);
    			t1 = claim_text(a0_nodes, "Elior Boukhobza & Jonas\n            Augsburger");
    			a0_nodes.forEach(detach_dev);
    			small0_nodes.forEach(detach_dev);
    			t2 = claim_text(div_nodes, "\n    -\n    ");
    			small1 = claim_element(div_nodes, "SMALL", {});
    			var small1_nodes = children(small1);
    			t3 = claim_text(small1_nodes, "Original concept from ");
    			a1 = claim_element(small1_nodes, "A", { target: true, href: true, class: true });
    			var a1_nodes = children(a1);
    			t4 = claim_text(a1_nodes, "Mike King");
    			a1_nodes.forEach(detach_dev);
    			small1_nodes.forEach(detach_dev);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://www.material-theme.com");
    			attr_dev(a0, "class", "svelte-1s2v8z2");
    			add_location(a0, file$8, 14, 18, 218);
    			add_location(small0, file$8, 13, 4, 176);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://github.com/micjamking");
    			attr_dev(a1, "class", "svelte-1s2v8z2");
    			add_location(a1, file$8, 17, 33, 373);
    			add_location(small1, file$8, 17, 4, 344);
    			attr_dev(div, "class", "footer svelte-1s2v8z2");
    			add_location(div, file$8, 12, 0, 151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, small0);
    			append_dev(small0, t0);
    			append_dev(small0, a0);
    			append_dev(a0, t1);
    			append_dev(div, t2);
    			append_dev(div, small1);
    			append_dev(small1, t3);
    			append_dev(small1, a1);
    			append_dev(a1, t4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1s2v8z2-style")) add_css$8();
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }
    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/components/Palette.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file$7 = "src/components/Palette.svelte";

    function add_css$7() {
    	var style = element("style");
    	style.id = "svelte-l3m3be-style";
    	style.textContent = ".palette.svelte-l3m3be.svelte-l3m3be{height:2em;margin-bottom:.5em;font-size:1em;display:flex;flex-direction:row;justify-content:space-between;align-content:center;align-items:center}.palette.svelte-l3m3be.svelte-l3m3be::after{display:table;content:'';clear:both}.palette.svelte-l3m3be li.svelte-l3m3be{position:relative;list-style:none;height:50%;display:block;float:left;z-index:1;flex:1;transition:transform 0.25s cubic-bezier(.55, 1.15, 0.1, 1.15);animation:zoomIn 0.15s cubic-bezier(0.215, 0.610, 0.355, 1.000) both}.palette.svelte-l3m3be li.svelte-l3m3be:before{content:'';display:block;width:100%;height:100%;background-color:inherit;transform:scale3d(1, 1, 1);box-shadow:none;position:absolute;border-radius:10%}.palette.svelte-l3m3be li.svelte-l3m3be:hover{z-index:2}.palette.svelte-l3m3be li.svelte-l3m3be:hover:before{border-radius:1%;transform:scale3d(1.5, 4, 1);box-shadow:0 0 0.125rem 0 rgba(0, 0, 0, 0.15);transition:transform 0.25s cubic-bezier(.55, 1.15, 0.1, 1.15)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFsZXR0ZS5zdmVsdGUiLCJzb3VyY2VzIjpbIlBhbGV0dGUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdHlsZT5cbiAgLnBhbGV0dGUge1xuICAgIGhlaWdodDogMmVtO1xuICAgIG1hcmdpbi1ib3R0b206IC41ZW07XG4gICAgZm9udC1zaXplOiAxZW07XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBhbGlnbi1jb250ZW50OiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgfVxuXG4gIC5wYWxldHRlOjphZnRlciB7XG4gICAgZGlzcGxheTogdGFibGU7XG4gICAgY29udGVudDogJyc7XG4gICAgY2xlYXI6IGJvdGg7XG4gIH1cblxuICAucGFsZXR0ZSBsaSB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGxpc3Qtc3R5bGU6IG5vbmU7XG4gICAgaGVpZ2h0OiA1MCU7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgZmxvYXQ6IGxlZnQ7XG4gICAgei1pbmRleDogMTtcbiAgICBmbGV4OiAxO1xuICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjI1cyBjdWJpYy1iZXppZXIoLjU1LCAxLjE1LCAwLjEsIDEuMTUpO1xuICAgIGFuaW1hdGlvbjogem9vbUluIDAuMTVzIGN1YmljLWJlemllcigwLjIxNSwgMC42MTAsIDAuMzU1LCAxLjAwMCkgYm90aDtcbiAgfVxuXG4gIC5wYWxldHRlIGxpOmJlZm9yZSB7XG4gICAgY29udGVudDogJyc7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIGJhY2tncm91bmQtY29sb3I6IGluaGVyaXQ7XG4gICAgdHJhbnNmb3JtOiBzY2FsZTNkKDEsIDEsIDEpO1xuICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGJvcmRlci1yYWRpdXM6IDEwJTtcbiAgfVxuXG4gIC5wYWxldHRlIGxpOmhvdmVyIHtcbiAgICB6LWluZGV4OiAyO1xuICB9XG5cbiAgLnBhbGV0dGUgbGk6aG92ZXI6YmVmb3JlIHtcbiAgICBib3JkZXItcmFkaXVzOiAxJTtcbiAgICB0cmFuc2Zvcm06IHNjYWxlM2QoMS41LCA0LCAxKTtcbiAgICBib3gtc2hhZG93OiAwIDAgMC4xMjVyZW0gMCByZ2JhKDAsIDAsIDAsIDAuMTUpO1xuICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjI1cyBjdWJpYy1iZXppZXIoLjU1LCAxLjE1LCAwLjEsIDEuMTUpO1xuICB9XG48L3N0eWxlPlxuXG48c2NyaXB0PlxuICBpbXBvcnQge2ZhZGV9IGZyb20gJ3N2ZWx0ZS90cmFuc2l0aW9uJztcbiAgaW1wb3J0IHthcHB9IGZyb20gJy4uLyRhcHAnO1xuXG4gIGZ1bmN0aW9uIGlzQ29sb3IoY29sb3IpIHtcbiAgICByZXR1cm4gY29sb3IgJiYgY29sb3Iuc3RhcnRzV2l0aCAmJiBjb2xvci5zdGFydHNXaXRoKCcjJyk7XG4gIH1cbjwvc2NyaXB0PlxuXG57I2lmICRhcHAuY3VycmVudFRoZW1lfVxuICAgIDx1bCBjbGFzcz1cInBhbGV0dGVcIiB0cmFuc2l0aW9uOmZhZGU+XG4gICAgICAgIHsjZWFjaCBPYmplY3QuZW50cmllcygkYXBwLmN1cnJlbnRUaGVtZS5jb2xvcnMpIGFzIFtrZXksIGNvbG9yXX1cbiAgICAgICAgICAgIHsjaWYgaXNDb2xvcihjb2xvcil9XG4gICAgICAgICAgICAgICAgPGxpIGNsYXNzPVwiYW5pbSBhbmltLWRlbGF5ZWRcIiBzdHlsZT1cImJhY2tncm91bmQ6IHtjb2xvcn1cIlxuICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIntrZXl9XCI+PC9saT5cbiAgICAgICAgICAgIHsvaWZ9XG4gICAgICAgIHsvZWFjaH1cbiAgICA8L3VsPlxuey9pZn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDRSxRQUFRLDRCQUFDLENBQUMsQUFDUixNQUFNLENBQUUsR0FBRyxDQUNYLGFBQWEsQ0FBRSxJQUFJLENBQ25CLFNBQVMsQ0FBRSxHQUFHLENBQ2QsT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsR0FBRyxDQUNuQixlQUFlLENBQUUsYUFBYSxDQUM5QixhQUFhLENBQUUsTUFBTSxDQUNyQixXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBRUQsb0NBQVEsT0FBTyxBQUFDLENBQUMsQUFDZixPQUFPLENBQUUsS0FBSyxDQUNkLE9BQU8sQ0FBRSxFQUFFLENBQ1gsS0FBSyxDQUFFLElBQUksQUFDYixDQUFDLEFBRUQsc0JBQVEsQ0FBQyxFQUFFLGNBQUMsQ0FBQyxBQUNYLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLE1BQU0sQ0FBRSxHQUFHLENBQ1gsT0FBTyxDQUFFLEtBQUssQ0FDZCxLQUFLLENBQUUsSUFBSSxDQUNYLE9BQU8sQ0FBRSxDQUFDLENBQ1YsSUFBSSxDQUFFLENBQUMsQ0FDUCxVQUFVLENBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUM5RCxTQUFTLENBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQUFDdkUsQ0FBQyxBQUVELHNCQUFRLENBQUMsZ0JBQUUsT0FBTyxBQUFDLENBQUMsQUFDbEIsT0FBTyxDQUFFLEVBQUUsQ0FDWCxPQUFPLENBQUUsS0FBSyxDQUNkLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLFNBQVMsQ0FBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUMzQixVQUFVLENBQUUsSUFBSSxDQUNoQixRQUFRLENBQUUsUUFBUSxDQUNsQixhQUFhLENBQUUsR0FBRyxBQUNwQixDQUFDLEFBRUQsc0JBQVEsQ0FBQyxnQkFBRSxNQUFNLEFBQUMsQ0FBQyxBQUNqQixPQUFPLENBQUUsQ0FBQyxBQUNaLENBQUMsQUFFRCxzQkFBUSxDQUFDLGdCQUFFLE1BQU0sT0FBTyxBQUFDLENBQUMsQUFDeEIsYUFBYSxDQUFFLEVBQUUsQ0FDakIsU0FBUyxDQUFFLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQzdCLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDOUMsVUFBVSxDQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQUFDaEUsQ0FBQyJ9 */";
    	append_dev(document.head, style);
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i][0];
    	child_ctx[2] = list[i][1];
    	return child_ctx;
    }

    // (64:0) {#if $app.currentTheme}
    function create_if_block$5(ctx) {
    	let ul;
    	let ul_transition;
    	let current;
    	let each_value = Object.entries(/*$app*/ ctx[0].currentTheme.colors);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.h();
    		},
    		l: function claim(nodes) {
    			ul = claim_element(nodes, "UL", { class: true });
    			var ul_nodes = children(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(ul_nodes);
    			}

    			ul_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(ul, "class", "palette svelte-l3m3be");
    			add_location(ul, file$7, 64, 4, 1307);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, $app, isColor*/ 1) {
    				each_value = Object.entries(/*$app*/ ctx[0].currentTheme.colors);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!ul_transition) ul_transition = create_bidirectional_transition(ul, fade, {}, true);
    				ul_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!ul_transition) ul_transition = create_bidirectional_transition(ul, fade, {}, false);
    			ul_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (detaching && ul_transition) ul_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(64:0) {#if $app.currentTheme}",
    		ctx
    	});

    	return block;
    }

    // (67:12) {#if isColor(color)}
    function create_if_block_1(ctx) {
    	let li;
    	let li_title_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			this.h();
    		},
    		l: function claim(nodes) {
    			li = claim_element(nodes, "LI", { class: true, style: true, title: true });
    			children(li).forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(li, "class", "anim anim-delayed svelte-l3m3be");
    			set_style(li, "background", /*color*/ ctx[2]);
    			attr_dev(li, "title", li_title_value = /*key*/ ctx[1]);
    			add_location(li, file$7, 67, 16, 1466);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$app*/ 1) {
    				set_style(li, "background", /*color*/ ctx[2]);
    			}

    			if (dirty & /*$app*/ 1 && li_title_value !== (li_title_value = /*key*/ ctx[1])) {
    				attr_dev(li, "title", li_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(67:12) {#if isColor(color)}",
    		ctx
    	});

    	return block;
    }

    // (66:8) {#each Object.entries($app.currentTheme.colors) as [key, color]}
    function create_each_block$1(ctx) {
    	let show_if = isColor(/*color*/ ctx[2]);
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$app*/ 1) show_if = isColor(/*color*/ ctx[2]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(66:8) {#each Object.entries($app.currentTheme.colors) as [key, color]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$app*/ ctx[0].currentTheme && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$app*/ ctx[0].currentTheme) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$app*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isColor(color) {
    	return color && color.startsWith && color.startsWith("#");
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Palette", slots, []);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Palette> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fade, app: app$1, isColor, $app });
    	return [$app];
    }

    class Palette extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-l3m3be-style")) add_css$7();
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Palette",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /**
     * Service to build the styles
     */
    const styleBuilder = {
      /**
       * Extract current theme colors and inject a style tag in the body
       * @param currentTheme
       * @param currentFontFamily
       * @param currentFontSize
       * @param accentColor
       */
      applyTheme({
                   currentTheme,
                   currentFontFamily = 'Menlo',
                   currentFontSize = 14,
                   accentColor = null,
                 } = {}) {
        // Extract colors
        if (currentTheme && currentTheme.colors) {
          const {
                  background,
                  foreground,
                  text,
                  selectBg,
                  selectFg,
                  button,
                  disabled,
                  contrast,
                  second,
                  table,
                  border,
                  hl,
                  tree,
                  notif,
                  accent,
                  excluded,
                  comments,
                  vars,
                  links,
                  functions,
                  keywords,
                  tags,
                  strings,
                  operators,
                  attributes,
                  numbers,
                  parameters,
                } = currentTheme.colors;

          // Create a style tag with css variables with colors
          const style = document.createElement('style');
          style.id = 'inject-style';
          style.innerHTML = this.styles({
            background,
            foreground,
            text,
            selectBg,
            selectFg,
            button,
            disabled,
            contrast,
            second,
            table,
            border,
            hl,
            tree,
            notif,
            accent,
            excluded,
            comments,
            vars,
            links,
            functions,
            keywords,
            tags,
            errors: tags,
            strings,
            operators,
            numbers,
            attributes,
            parameters,
            fontFamily: currentFontFamily,
            fontSize: currentFontSize,
            accentColor,
          });

          const styleElem = document.getElementById('inject-style');
          if (styleElem) {
            document.head.removeChild(styleElem);
          }
          document.head.appendChild(style);
        }
      },

      /**
       * Extract the styles and create a css string to be injected to a style tag
       * @param background
       * @param foreground
       * @param primary
       * @param selectBg
       * @param selectFg
       * @param button
       * @param disabled
       * @param contrast
       * @param second
       * @param darkerBg
       * @param lighterBg
       * @param table
       * @param border
       * @param highlight
       * @param tree
       * @param notif
       * @param accent
       * @param accent2
       * @param accent3
       * @param excluded
       * @param comments
       * @param vars
       * @param links
       * @param functions
       * @param keywords
       * @param tags
       * @param errors
       * @param strings
       * @param operators
       * @param numbers
       * @param attributes
       * @param parameters
       * @param fontFamily
       * @param fontSize
       * @param accentColor
       * @returns {string}
       */
      styles({
               background,
               foreground,
               text,
               selectBg,
               selectFg,
               selectFg2,
               button,
               disabled,
               contrast,
               second,
               table,
               border,
               hl,
               tree,
               notif,
               accent,
               excluded,
               comments,
               vars,
               links,
               functions,
               keywords,
               tags,
               errors,
               strings,
               operators,
               numbers,
               attributes,
               parameters,
               fontFamily,
               fontSize,
               accentColor,
             }) {
        return `
  :root {
  --bg: ${background};
  --fg: ${foreground};
  --text: ${text};
  --selBg: ${selectBg};
  --selFg: ${selectFg};
  --selFg2: ${selectFg2};
  --button: ${button};
  --disabled: ${disabled};
  --contrast: ${contrast};
  --second: ${second};
  --active: ${table};
  --border: ${border};
  --hl: ${hl};
  --tree: ${tree};
  --notif: ${notif};
  --accent: ${accentColor || accent};
  --excluded: ${excluded};

  --tags: ${tags};
  --attributes: ${attributes};
  --comments: ${comments};
  --keywords: ${keywords};
  --errors: ${errors};
  --vars: ${vars};
  --operators: ${operators};
  --functions: ${functions};
  --strings: ${strings};
  --numbers: ${numbers};
  --links: ${links};
  --parameters: ${parameters};
  
  --ui-font-family: Roboto, Helvetica Neue, Arial, sans-serif;
  --font-family: ${fontFamily}, Menlo, Consolas, "Fira Code", monospace;
  --font-size: ${fontSize || 10}px;
  }
`;
      },
    };

    /* src/components/ThemeSelector.svelte generated by Svelte v3.38.2 */
    const file$6 = "src/components/ThemeSelector.svelte";

    function add_css$6() {
    	var style = element("style");
    	style.id = "svelte-vx8a7s-style";
    	style.textContent = ".theme-selector.svelte-vx8a7s{grid-area:content}.theme-options.svelte-vx8a7s{border-radius:0.125rem;border:0.0625rem solid var(--hl);background:var(--contrast);background-position:100% center;background-repeat:no-repeat;line-height:normal;font:inherit;font-size:0.875rem;color:var(--fg);text-transform:none;margin:0 auto 1em;display:block}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGhlbWVTZWxlY3Rvci5zdmVsdGUiLCJzb3VyY2VzIjpbIlRoZW1lU2VsZWN0b3Iuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdHlsZT5cbiAgLnRoZW1lLXNlbGVjdG9yIHtcbiAgICBncmlkLWFyZWE6IGNvbnRlbnQ7XG4gIH1cblxuICAudGhlbWUtb3B0aW9ucyB7XG4gICAgYm9yZGVyLXJhZGl1czogMC4xMjVyZW07XG4gICAgYm9yZGVyOiAwLjA2MjVyZW0gc29saWQgdmFyKC0taGwpO1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWNvbnRyYXN0KTtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiAxMDAlIGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kLXJlcGVhdDogbm8tcmVwZWF0O1xuICAgIGxpbmUtaGVpZ2h0OiBub3JtYWw7XG4gICAgZm9udDogaW5oZXJpdDtcbiAgICBmb250LXNpemU6IDAuODc1cmVtO1xuICAgIGNvbG9yOiB2YXIoLS1mZyk7XG4gICAgdGV4dC10cmFuc2Zvcm06IG5vbmU7XG4gICAgbWFyZ2luOiAwIGF1dG8gMWVtO1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICB9XG48L3N0eWxlPlxuXG48c2NyaXB0PlxuICBpbXBvcnQge29uTW91bnR9IGZyb20gJ3N2ZWx0ZSc7XG4gIGltcG9ydCB7YXBwfSBmcm9tICcuLi8kYXBwJztcbiAgaW1wb3J0IHtzdHlsZUJ1aWxkZXJ9IGZyb20gJy4uL3N0eWxlLWJ1aWxkZXInO1xuXG4gIGZ1bmN0aW9uIGFwcGx5VGhlbWUoKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiBzdHlsZUJ1aWxkZXIuYXBwbHlUaGVtZSh7XG4gICAgICBjdXJyZW50VGhlbWU6ICRhcHAuY3VycmVudFRoZW1lLFxuICAgICAgY3VycmVudEZvbnRGYW1pbHk6ICRhcHAuY3VycmVudEZvbnRGYW1pbHksXG4gICAgICBjdXJyZW50Rm9udFNpemU6ICRhcHAuY3VycmVudEZvbnRTaXplLFxuICAgICAgY3VycmVudEFjY2VudENvbG9yOiAkYXBwLmN1cnJlbnRBY2NlbnRDb2xvcixcbiAgICB9KSwgMTAwKTtcbiAgfVxuXG4gIG9uTW91bnQoYXBwbHlUaGVtZSk7XG5cbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwidGhlbWUtc2VsZWN0b3JcIj5cbiAgICA8bGFiZWwgZm9yPVwidGhlbWUtb3B0aW9uc1wiPlNlbGVjdGVkIFRoZW1lOjwvbGFiZWw+XG4gICAgPHNlbGVjdCBjbGFzcz1cInRoZW1lLW9wdGlvbnNcIlxuICAgICAgICAgICAgaWQ9XCJ0aGVtZS1vcHRpb25zXCJcbiAgICAgICAgICAgIG9uOmNoYW5nZT1cInthcHBseVRoZW1lfVwiXG4gICAgICAgICAgICBiaW5kOnZhbHVlPXskYXBwLmN1cnJlbnRUaGVtZU5hbWV9PlxuICAgICAgICB7I2VhY2ggJGFwcC50aGVtZXMgYXMgdGhlbWUodGhlbWUubmFtZSl9XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPXt0aGVtZS5uYW1lfT57dGhlbWUubmFtZX08L29wdGlvbj5cbiAgICAgICAgey9lYWNofVxuICAgIDwvc2VsZWN0PlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNFLGVBQWUsY0FBQyxDQUFDLEFBQ2YsU0FBUyxDQUFFLE9BQU8sQUFDcEIsQ0FBQyxBQUVELGNBQWMsY0FBQyxDQUFDLEFBQ2QsYUFBYSxDQUFFLFFBQVEsQ0FDdkIsTUFBTSxDQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FDakMsVUFBVSxDQUFFLElBQUksVUFBVSxDQUFDLENBQzNCLG1CQUFtQixDQUFFLElBQUksQ0FBQyxNQUFNLENBQ2hDLGlCQUFpQixDQUFFLFNBQVMsQ0FDNUIsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsSUFBSSxDQUFFLE9BQU8sQ0FDYixTQUFTLENBQUUsUUFBUSxDQUNuQixLQUFLLENBQUUsSUFBSSxJQUFJLENBQUMsQ0FDaEIsY0FBYyxDQUFFLElBQUksQ0FDcEIsTUFBTSxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUNsQixPQUFPLENBQUUsS0FBSyxBQUNoQixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (46:8) {#each $app.themes as theme(theme.name)}
    function create_each_block(key_1, ctx) {
    	let option;
    	let t_value = /*theme*/ ctx[3].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			this.h();
    		},
    		l: function claim(nodes) {
    			option = claim_element(nodes, "OPTION", { value: true });
    			var option_nodes = children(option);
    			t = claim_text(option_nodes, t_value);
    			option_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			option.__value = option_value_value = /*theme*/ ctx[3].name;
    			option.value = option.__value;
    			add_location(option, file$6, 46, 12, 1154);
    			this.first = option;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$app*/ 1 && t_value !== (t_value = /*theme*/ ctx[3].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*$app*/ 1 && option_value_value !== (option_value_value = /*theme*/ ctx[3].name)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(46:8) {#each $app.themes as theme(theme.name)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let label;
    	let t0;
    	let t1;
    	let select;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value = /*$app*/ ctx[0].themes;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*theme*/ ctx[3].name;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text("Selected Theme:");
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			label = claim_element(div_nodes, "LABEL", { for: true });
    			var label_nodes = children(label);
    			t0 = claim_text(label_nodes, "Selected Theme:");
    			label_nodes.forEach(detach_dev);
    			t1 = claim_space(div_nodes);
    			select = claim_element(div_nodes, "SELECT", { class: true, id: true });
    			var select_nodes = children(select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(select_nodes);
    			}

    			select_nodes.forEach(detach_dev);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(label, "for", "theme-options");
    			add_location(label, file$6, 40, 4, 892);
    			attr_dev(select, "class", "theme-options svelte-vx8a7s");
    			attr_dev(select, "id", "theme-options");
    			if (/*$app*/ ctx[0].currentThemeName === void 0) add_render_callback(() => /*select_change_handler*/ ctx[2].call(select));
    			add_location(select, file$6, 41, 4, 947);
    			attr_dev(div, "class", "theme-selector svelte-vx8a7s");
    			add_location(div, file$6, 39, 0, 859);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, t0);
    			append_dev(div, t1);
    			append_dev(div, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*$app*/ ctx[0].currentThemeName);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*applyTheme*/ ctx[1], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[2])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$app*/ 1) {
    				each_value = /*$app*/ ctx[0].themes;
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, select, destroy_block, create_each_block, null, get_each_context);
    			}

    			if (dirty & /*$app*/ 1) {
    				select_option(select, /*$app*/ ctx[0].currentThemeName);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ThemeSelector", slots, []);

    	function applyTheme() {
    		setTimeout(
    			() => styleBuilder.applyTheme({
    				currentTheme: $app.currentTheme,
    				currentFontFamily: $app.currentFontFamily,
    				currentFontSize: $app.currentFontSize,
    				currentAccentColor: $app.currentAccentColor
    			}),
    			100
    		);
    	}

    	onMount(applyTheme);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ThemeSelector> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		$app.currentThemeName = select_value(this);
    		app$1.set($app);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		app: app$1,
    		styleBuilder,
    		applyTheme,
    		$app
    	});

    	return [$app, applyTheme, select_change_handler];
    }

    class ThemeSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-vx8a7s-style")) add_css$6();
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThemeSelector",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var prism = {exports: {}};

    (function (module) {
    /* **********************************************
         Begin prism-core.js
    ********************************************** */

    /// <reference lib="WebWorker"/>

    var _self = (typeof window !== 'undefined')
    	? window   // if in browser
    	: (
    		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
    		? self // if in worker
    		: {}   // if in node js
    	);

    /**
     * Prism: Lightweight, robust, elegant syntax highlighting
     *
     * @license MIT <https://opensource.org/licenses/MIT>
     * @author Lea Verou <https://lea.verou.me>
     * @namespace
     * @public
     */
    var Prism = (function (_self){

    // Private helper vars
    var lang = /\blang(?:uage)?-([\w-]+)\b/i;
    var uniqueId = 0;


    var _ = {
    	/**
    	 * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
    	 * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
    	 * additional languages or plugins yourself.
    	 *
    	 * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
    	 *
    	 * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
    	 * empty Prism object into the global scope before loading the Prism script like this:
    	 *
    	 * ```js
    	 * window.Prism = window.Prism || {};
    	 * Prism.manual = true;
    	 * // add a new <script> to load Prism's script
    	 * ```
    	 *
    	 * @default false
    	 * @type {boolean}
    	 * @memberof Prism
    	 * @public
    	 */
    	manual: _self.Prism && _self.Prism.manual,
    	disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

    	/**
    	 * A namespace for utility methods.
    	 *
    	 * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
    	 * change or disappear at any time.
    	 *
    	 * @namespace
    	 * @memberof Prism
    	 */
    	util: {
    		encode: function encode(tokens) {
    			if (tokens instanceof Token) {
    				return new Token(tokens.type, encode(tokens.content), tokens.alias);
    			} else if (Array.isArray(tokens)) {
    				return tokens.map(encode);
    			} else {
    				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
    			}
    		},

    		/**
    		 * Returns the name of the type of the given value.
    		 *
    		 * @param {any} o
    		 * @returns {string}
    		 * @example
    		 * type(null)      === 'Null'
    		 * type(undefined) === 'Undefined'
    		 * type(123)       === 'Number'
    		 * type('foo')     === 'String'
    		 * type(true)      === 'Boolean'
    		 * type([1, 2])    === 'Array'
    		 * type({})        === 'Object'
    		 * type(String)    === 'Function'
    		 * type(/abc+/)    === 'RegExp'
    		 */
    		type: function (o) {
    			return Object.prototype.toString.call(o).slice(8, -1);
    		},

    		/**
    		 * Returns a unique number for the given object. Later calls will still return the same number.
    		 *
    		 * @param {Object} obj
    		 * @returns {number}
    		 */
    		objId: function (obj) {
    			if (!obj['__id']) {
    				Object.defineProperty(obj, '__id', { value: ++uniqueId });
    			}
    			return obj['__id'];
    		},

    		/**
    		 * Creates a deep clone of the given object.
    		 *
    		 * The main intended use of this function is to clone language definitions.
    		 *
    		 * @param {T} o
    		 * @param {Record<number, any>} [visited]
    		 * @returns {T}
    		 * @template T
    		 */
    		clone: function deepClone(o, visited) {
    			visited = visited || {};

    			var clone, id;
    			switch (_.util.type(o)) {
    				case 'Object':
    					id = _.util.objId(o);
    					if (visited[id]) {
    						return visited[id];
    					}
    					clone = /** @type {Record<string, any>} */ ({});
    					visited[id] = clone;

    					for (var key in o) {
    						if (o.hasOwnProperty(key)) {
    							clone[key] = deepClone(o[key], visited);
    						}
    					}

    					return /** @type {any} */ (clone);

    				case 'Array':
    					id = _.util.objId(o);
    					if (visited[id]) {
    						return visited[id];
    					}
    					clone = [];
    					visited[id] = clone;

    					(/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
    						clone[i] = deepClone(v, visited);
    					});

    					return /** @type {any} */ (clone);

    				default:
    					return o;
    			}
    		},

    		/**
    		 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
    		 *
    		 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
    		 *
    		 * @param {Element} element
    		 * @returns {string}
    		 */
    		getLanguage: function (element) {
    			while (element && !lang.test(element.className)) {
    				element = element.parentElement;
    			}
    			if (element) {
    				return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
    			}
    			return 'none';
    		},

    		/**
    		 * Returns the script element that is currently executing.
    		 *
    		 * This does __not__ work for line script element.
    		 *
    		 * @returns {HTMLScriptElement | null}
    		 */
    		currentScript: function () {
    			if (typeof document === 'undefined') {
    				return null;
    			}
    			if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */) {
    				return /** @type {any} */ (document.currentScript);
    			}

    			// IE11 workaround
    			// we'll get the src of the current script by parsing IE11's error stack trace
    			// this will not work for inline scripts

    			try {
    				throw new Error();
    			} catch (err) {
    				// Get file src url from stack. Specifically works with the format of stack traces in IE.
    				// A stack will look like this:
    				//
    				// Error
    				//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
    				//    at Global code (http://localhost/components/prism-core.js:606:1)

    				var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];
    				if (src) {
    					var scripts = document.getElementsByTagName('script');
    					for (var i in scripts) {
    						if (scripts[i].src == src) {
    							return scripts[i];
    						}
    					}
    				}
    				return null;
    			}
    		},

    		/**
    		 * Returns whether a given class is active for `element`.
    		 *
    		 * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
    		 * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
    		 * given class is just the given class with a `no-` prefix.
    		 *
    		 * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
    		 * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
    		 * ancestors have the given class or the negated version of it, then the default activation will be returned.
    		 *
    		 * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
    		 * version of it, the class is considered active.
    		 *
    		 * @param {Element} element
    		 * @param {string} className
    		 * @param {boolean} [defaultActivation=false]
    		 * @returns {boolean}
    		 */
    		isActive: function (element, className, defaultActivation) {
    			var no = 'no-' + className;

    			while (element) {
    				var classList = element.classList;
    				if (classList.contains(className)) {
    					return true;
    				}
    				if (classList.contains(no)) {
    					return false;
    				}
    				element = element.parentElement;
    			}
    			return !!defaultActivation;
    		}
    	},

    	/**
    	 * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
    	 *
    	 * @namespace
    	 * @memberof Prism
    	 * @public
    	 */
    	languages: {
    		/**
    		 * Creates a deep copy of the language with the given id and appends the given tokens.
    		 *
    		 * If a token in `redef` also appears in the copied language, then the existing token in the copied language
    		 * will be overwritten at its original position.
    		 *
    		 * ## Best practices
    		 *
    		 * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
    		 * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
    		 * understand the language definition because, normally, the order of tokens matters in Prism grammars.
    		 *
    		 * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
    		 * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
    		 *
    		 * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
    		 * @param {Grammar} redef The new tokens to append.
    		 * @returns {Grammar} The new language created.
    		 * @public
    		 * @example
    		 * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
    		 *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
    		 *     // at its original position
    		 *     'comment': { ... },
    		 *     // CSS doesn't have a 'color' token, so this token will be appended
    		 *     'color': /\b(?:red|green|blue)\b/
    		 * });
    		 */
    		extend: function (id, redef) {
    			var lang = _.util.clone(_.languages[id]);

    			for (var key in redef) {
    				lang[key] = redef[key];
    			}

    			return lang;
    		},

    		/**
    		 * Inserts tokens _before_ another token in a language definition or any other grammar.
    		 *
    		 * ## Usage
    		 *
    		 * This helper method makes it easy to modify existing languages. For example, the CSS language definition
    		 * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
    		 * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
    		 * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
    		 * this:
    		 *
    		 * ```js
    		 * Prism.languages.markup.style = {
    		 *     // token
    		 * };
    		 * ```
    		 *
    		 * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
    		 * before existing tokens. For the CSS example above, you would use it like this:
    		 *
    		 * ```js
    		 * Prism.languages.insertBefore('markup', 'cdata', {
    		 *     'style': {
    		 *         // token
    		 *     }
    		 * });
    		 * ```
    		 *
    		 * ## Special cases
    		 *
    		 * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
    		 * will be ignored.
    		 *
    		 * This behavior can be used to insert tokens after `before`:
    		 *
    		 * ```js
    		 * Prism.languages.insertBefore('markup', 'comment', {
    		 *     'comment': Prism.languages.markup.comment,
    		 *     // tokens after 'comment'
    		 * });
    		 * ```
    		 *
    		 * ## Limitations
    		 *
    		 * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
    		 * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
    		 * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
    		 * deleting properties which is necessary to insert at arbitrary positions.
    		 *
    		 * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
    		 * Instead, it will create a new object and replace all references to the target object with the new one. This
    		 * can be done without temporarily deleting properties, so the iteration order is well-defined.
    		 *
    		 * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
    		 * you hold the target object in a variable, then the value of the variable will not change.
    		 *
    		 * ```js
    		 * var oldMarkup = Prism.languages.markup;
    		 * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
    		 *
    		 * assert(oldMarkup !== Prism.languages.markup);
    		 * assert(newMarkup === Prism.languages.markup);
    		 * ```
    		 *
    		 * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
    		 * object to be modified.
    		 * @param {string} before The key to insert before.
    		 * @param {Grammar} insert An object containing the key-value pairs to be inserted.
    		 * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
    		 * object to be modified.
    		 *
    		 * Defaults to `Prism.languages`.
    		 * @returns {Grammar} The new grammar object.
    		 * @public
    		 */
    		insertBefore: function (inside, before, insert, root) {
    			root = root || /** @type {any} */ (_.languages);
    			var grammar = root[inside];
    			/** @type {Grammar} */
    			var ret = {};

    			for (var token in grammar) {
    				if (grammar.hasOwnProperty(token)) {

    					if (token == before) {
    						for (var newToken in insert) {
    							if (insert.hasOwnProperty(newToken)) {
    								ret[newToken] = insert[newToken];
    							}
    						}
    					}

    					// Do not insert token which also occur in insert. See #1525
    					if (!insert.hasOwnProperty(token)) {
    						ret[token] = grammar[token];
    					}
    				}
    			}

    			var old = root[inside];
    			root[inside] = ret;

    			// Update references in other language definitions
    			_.languages.DFS(_.languages, function(key, value) {
    				if (value === old && key != inside) {
    					this[key] = ret;
    				}
    			});

    			return ret;
    		},

    		// Traverse a language definition with Depth First Search
    		DFS: function DFS(o, callback, type, visited) {
    			visited = visited || {};

    			var objId = _.util.objId;

    			for (var i in o) {
    				if (o.hasOwnProperty(i)) {
    					callback.call(o, i, o[i], type || i);

    					var property = o[i],
    					    propertyType = _.util.type(property);

    					if (propertyType === 'Object' && !visited[objId(property)]) {
    						visited[objId(property)] = true;
    						DFS(property, callback, null, visited);
    					}
    					else if (propertyType === 'Array' && !visited[objId(property)]) {
    						visited[objId(property)] = true;
    						DFS(property, callback, i, visited);
    					}
    				}
    			}
    		}
    	},

    	plugins: {},

    	/**
    	 * This is the most high-level function in Prism’s API.
    	 * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
    	 * each one of them.
    	 *
    	 * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
    	 *
    	 * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
    	 * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
    	 * @memberof Prism
    	 * @public
    	 */
    	highlightAll: function(async, callback) {
    		_.highlightAllUnder(document, async, callback);
    	},

    	/**
    	 * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
    	 * {@link Prism.highlightElement} on each one of them.
    	 *
    	 * The following hooks will be run:
    	 * 1. `before-highlightall`
    	 * 2. `before-all-elements-highlight`
    	 * 3. All hooks of {@link Prism.highlightElement} for each element.
    	 *
    	 * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
    	 * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
    	 * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
    	 * @memberof Prism
    	 * @public
    	 */
    	highlightAllUnder: function(container, async, callback) {
    		var env = {
    			callback: callback,
    			container: container,
    			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
    		};

    		_.hooks.run('before-highlightall', env);

    		env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

    		_.hooks.run('before-all-elements-highlight', env);

    		for (var i = 0, element; element = env.elements[i++];) {
    			_.highlightElement(element, async === true, env.callback);
    		}
    	},

    	/**
    	 * Highlights the code inside a single element.
    	 *
    	 * The following hooks will be run:
    	 * 1. `before-sanity-check`
    	 * 2. `before-highlight`
    	 * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
    	 * 4. `before-insert`
    	 * 5. `after-highlight`
    	 * 6. `complete`
    	 *
    	 * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
    	 * the element's language.
    	 *
    	 * @param {Element} element The element containing the code.
    	 * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
    	 * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
    	 * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
    	 * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
    	 *
    	 * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
    	 * asynchronous highlighting to work. You can build your own bundle on the
    	 * [Download page](https://prismjs.com/download.html).
    	 * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
    	 * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
    	 * @memberof Prism
    	 * @public
    	 */
    	highlightElement: function(element, async, callback) {
    		// Find language
    		var language = _.util.getLanguage(element);
    		var grammar = _.languages[language];

    		// Set language on the element, if not present
    		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

    		// Set language on the parent, for styling
    		var parent = element.parentElement;
    		if (parent && parent.nodeName.toLowerCase() === 'pre') {
    			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
    		}

    		var code = element.textContent;

    		var env = {
    			element: element,
    			language: language,
    			grammar: grammar,
    			code: code
    		};

    		function insertHighlightedCode(highlightedCode) {
    			env.highlightedCode = highlightedCode;

    			_.hooks.run('before-insert', env);

    			env.element.innerHTML = env.highlightedCode;

    			_.hooks.run('after-highlight', env);
    			_.hooks.run('complete', env);
    			callback && callback.call(env.element);
    		}

    		_.hooks.run('before-sanity-check', env);

    		if (!env.code) {
    			_.hooks.run('complete', env);
    			callback && callback.call(env.element);
    			return;
    		}

    		_.hooks.run('before-highlight', env);

    		if (!env.grammar) {
    			insertHighlightedCode(_.util.encode(env.code));
    			return;
    		}

    		if (async && _self.Worker) {
    			var worker = new Worker(_.filename);

    			worker.onmessage = function(evt) {
    				insertHighlightedCode(evt.data);
    			};

    			worker.postMessage(JSON.stringify({
    				language: env.language,
    				code: env.code,
    				immediateClose: true
    			}));
    		}
    		else {
    			insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
    		}
    	},

    	/**
    	 * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
    	 * and the language definitions to use, and returns a string with the HTML produced.
    	 *
    	 * The following hooks will be run:
    	 * 1. `before-tokenize`
    	 * 2. `after-tokenize`
    	 * 3. `wrap`: On each {@link Token}.
    	 *
    	 * @param {string} text A string with the code to be highlighted.
    	 * @param {Grammar} grammar An object containing the tokens to use.
    	 *
    	 * Usually a language definition like `Prism.languages.markup`.
    	 * @param {string} language The name of the language definition passed to `grammar`.
    	 * @returns {string} The highlighted HTML.
    	 * @memberof Prism
    	 * @public
    	 * @example
    	 * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
    	 */
    	highlight: function (text, grammar, language) {
    		var env = {
    			code: text,
    			grammar: grammar,
    			language: language
    		};
    		_.hooks.run('before-tokenize', env);
    		env.tokens = _.tokenize(env.code, env.grammar);
    		_.hooks.run('after-tokenize', env);
    		return Token.stringify(_.util.encode(env.tokens), env.language);
    	},

    	/**
    	 * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
    	 * and the language definitions to use, and returns an array with the tokenized code.
    	 *
    	 * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
    	 *
    	 * This method could be useful in other contexts as well, as a very crude parser.
    	 *
    	 * @param {string} text A string with the code to be highlighted.
    	 * @param {Grammar} grammar An object containing the tokens to use.
    	 *
    	 * Usually a language definition like `Prism.languages.markup`.
    	 * @returns {TokenStream} An array of strings and tokens, a token stream.
    	 * @memberof Prism
    	 * @public
    	 * @example
    	 * let code = `var foo = 0;`;
    	 * let tokens = Prism.tokenize(code, Prism.languages.javascript);
    	 * tokens.forEach(token => {
    	 *     if (token instanceof Prism.Token && token.type === 'number') {
    	 *         console.log(`Found numeric literal: ${token.content}`);
    	 *     }
    	 * });
    	 */
    	tokenize: function(text, grammar) {
    		var rest = grammar.rest;
    		if (rest) {
    			for (var token in rest) {
    				grammar[token] = rest[token];
    			}

    			delete grammar.rest;
    		}

    		var tokenList = new LinkedList();
    		addAfter(tokenList, tokenList.head, text);

    		matchGrammar(text, tokenList, grammar, tokenList.head, 0);

    		return toArray(tokenList);
    	},

    	/**
    	 * @namespace
    	 * @memberof Prism
    	 * @public
    	 */
    	hooks: {
    		all: {},

    		/**
    		 * Adds the given callback to the list of callbacks for the given hook.
    		 *
    		 * The callback will be invoked when the hook it is registered for is run.
    		 * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
    		 *
    		 * One callback function can be registered to multiple hooks and the same hook multiple times.
    		 *
    		 * @param {string} name The name of the hook.
    		 * @param {HookCallback} callback The callback function which is given environment variables.
    		 * @public
    		 */
    		add: function (name, callback) {
    			var hooks = _.hooks.all;

    			hooks[name] = hooks[name] || [];

    			hooks[name].push(callback);
    		},

    		/**
    		 * Runs a hook invoking all registered callbacks with the given environment variables.
    		 *
    		 * Callbacks will be invoked synchronously and in the order in which they were registered.
    		 *
    		 * @param {string} name The name of the hook.
    		 * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
    		 * @public
    		 */
    		run: function (name, env) {
    			var callbacks = _.hooks.all[name];

    			if (!callbacks || !callbacks.length) {
    				return;
    			}

    			for (var i=0, callback; callback = callbacks[i++];) {
    				callback(env);
    			}
    		}
    	},

    	Token: Token
    };
    _self.Prism = _;


    // Typescript note:
    // The following can be used to import the Token type in JSDoc:
    //
    //   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

    /**
     * Creates a new token.
     *
     * @param {string} type See {@link Token#type type}
     * @param {string | TokenStream} content See {@link Token#content content}
     * @param {string|string[]} [alias] The alias(es) of the token.
     * @param {string} [matchedStr=""] A copy of the full string this token was created from.
     * @class
     * @global
     * @public
     */
    function Token(type, content, alias, matchedStr) {
    	/**
    	 * The type of the token.
    	 *
    	 * This is usually the key of a pattern in a {@link Grammar}.
    	 *
    	 * @type {string}
    	 * @see GrammarToken
    	 * @public
    	 */
    	this.type = type;
    	/**
    	 * The strings or tokens contained by this token.
    	 *
    	 * This will be a token stream if the pattern matched also defined an `inside` grammar.
    	 *
    	 * @type {string | TokenStream}
    	 * @public
    	 */
    	this.content = content;
    	/**
    	 * The alias(es) of the token.
    	 *
    	 * @type {string|string[]}
    	 * @see GrammarToken
    	 * @public
    	 */
    	this.alias = alias;
    	// Copy of the full string this token was created from
    	this.length = (matchedStr || '').length | 0;
    }

    /**
     * A token stream is an array of strings and {@link Token Token} objects.
     *
     * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
     * them.
     *
     * 1. No adjacent strings.
     * 2. No empty strings.
     *
     *    The only exception here is the token stream that only contains the empty string and nothing else.
     *
     * @typedef {Array<string | Token>} TokenStream
     * @global
     * @public
     */

    /**
     * Converts the given token or token stream to an HTML representation.
     *
     * The following hooks will be run:
     * 1. `wrap`: On each {@link Token}.
     *
     * @param {string | Token | TokenStream} o The token or token stream to be converted.
     * @param {string} language The name of current language.
     * @returns {string} The HTML representation of the token or token stream.
     * @memberof Token
     * @static
     */
    Token.stringify = function stringify(o, language) {
    	if (typeof o == 'string') {
    		return o;
    	}
    	if (Array.isArray(o)) {
    		var s = '';
    		o.forEach(function (e) {
    			s += stringify(e, language);
    		});
    		return s;
    	}

    	var env = {
    		type: o.type,
    		content: stringify(o.content, language),
    		tag: 'span',
    		classes: ['token', o.type],
    		attributes: {},
    		language: language
    	};

    	var aliases = o.alias;
    	if (aliases) {
    		if (Array.isArray(aliases)) {
    			Array.prototype.push.apply(env.classes, aliases);
    		} else {
    			env.classes.push(aliases);
    		}
    	}

    	_.hooks.run('wrap', env);

    	var attributes = '';
    	for (var name in env.attributes) {
    		attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
    	}

    	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    };

    /**
     * @param {RegExp} pattern
     * @param {number} pos
     * @param {string} text
     * @param {boolean} lookbehind
     * @returns {RegExpExecArray | null}
     */
    function matchPattern(pattern, pos, text, lookbehind) {
    	pattern.lastIndex = pos;
    	var match = pattern.exec(text);
    	if (match && lookbehind && match[1]) {
    		// change the match to remove the text matched by the Prism lookbehind group
    		var lookbehindLength = match[1].length;
    		match.index += lookbehindLength;
    		match[0] = match[0].slice(lookbehindLength);
    	}
    	return match;
    }

    /**
     * @param {string} text
     * @param {LinkedList<string | Token>} tokenList
     * @param {any} grammar
     * @param {LinkedListNode<string | Token>} startNode
     * @param {number} startPos
     * @param {RematchOptions} [rematch]
     * @returns {void}
     * @private
     *
     * @typedef RematchOptions
     * @property {string} cause
     * @property {number} reach
     */
    function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
    	for (var token in grammar) {
    		if (!grammar.hasOwnProperty(token) || !grammar[token]) {
    			continue;
    		}

    		var patterns = grammar[token];
    		patterns = Array.isArray(patterns) ? patterns : [patterns];

    		for (var j = 0; j < patterns.length; ++j) {
    			if (rematch && rematch.cause == token + ',' + j) {
    				return;
    			}

    			var patternObj = patterns[j],
    				inside = patternObj.inside,
    				lookbehind = !!patternObj.lookbehind,
    				greedy = !!patternObj.greedy,
    				alias = patternObj.alias;

    			if (greedy && !patternObj.pattern.global) {
    				// Without the global flag, lastIndex won't work
    				var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
    				patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
    			}

    			/** @type {RegExp} */
    			var pattern = patternObj.pattern || patternObj;

    			for ( // iterate the token list and keep track of the current token/string position
    				var currentNode = startNode.next, pos = startPos;
    				currentNode !== tokenList.tail;
    				pos += currentNode.value.length, currentNode = currentNode.next
    			) {

    				if (rematch && pos >= rematch.reach) {
    					break;
    				}

    				var str = currentNode.value;

    				if (tokenList.length > text.length) {
    					// Something went terribly wrong, ABORT, ABORT!
    					return;
    				}

    				if (str instanceof Token) {
    					continue;
    				}

    				var removeCount = 1; // this is the to parameter of removeBetween
    				var match;

    				if (greedy) {
    					match = matchPattern(pattern, pos, text, lookbehind);
    					if (!match) {
    						break;
    					}

    					var from = match.index;
    					var to = match.index + match[0].length;
    					var p = pos;

    					// find the node that contains the match
    					p += currentNode.value.length;
    					while (from >= p) {
    						currentNode = currentNode.next;
    						p += currentNode.value.length;
    					}
    					// adjust pos (and p)
    					p -= currentNode.value.length;
    					pos = p;

    					// the current node is a Token, then the match starts inside another Token, which is invalid
    					if (currentNode.value instanceof Token) {
    						continue;
    					}

    					// find the last node which is affected by this match
    					for (
    						var k = currentNode;
    						k !== tokenList.tail && (p < to || typeof k.value === 'string');
    						k = k.next
    					) {
    						removeCount++;
    						p += k.value.length;
    					}
    					removeCount--;

    					// replace with the new match
    					str = text.slice(pos, p);
    					match.index -= pos;
    				} else {
    					match = matchPattern(pattern, 0, str, lookbehind);
    					if (!match) {
    						continue;
    					}
    				}

    				var from = match.index,
    					matchStr = match[0],
    					before = str.slice(0, from),
    					after = str.slice(from + matchStr.length);

    				var reach = pos + str.length;
    				if (rematch && reach > rematch.reach) {
    					rematch.reach = reach;
    				}

    				var removeFrom = currentNode.prev;

    				if (before) {
    					removeFrom = addAfter(tokenList, removeFrom, before);
    					pos += before.length;
    				}

    				removeRange(tokenList, removeFrom, removeCount);

    				var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
    				currentNode = addAfter(tokenList, removeFrom, wrapped);

    				if (after) {
    					addAfter(tokenList, currentNode, after);
    				}

    				if (removeCount > 1) {
    					// at least one Token object was removed, so we have to do some rematching
    					// this can only happen if the current pattern is greedy
    					matchGrammar(text, tokenList, grammar, currentNode.prev, pos, {
    						cause: token + ',' + j,
    						reach: reach
    					});
    				}
    			}
    		}
    	}
    }

    /**
     * @typedef LinkedListNode
     * @property {T} value
     * @property {LinkedListNode<T> | null} prev The previous node.
     * @property {LinkedListNode<T> | null} next The next node.
     * @template T
     * @private
     */

    /**
     * @template T
     * @private
     */
    function LinkedList() {
    	/** @type {LinkedListNode<T>} */
    	var head = { value: null, prev: null, next: null };
    	/** @type {LinkedListNode<T>} */
    	var tail = { value: null, prev: head, next: null };
    	head.next = tail;

    	/** @type {LinkedListNode<T>} */
    	this.head = head;
    	/** @type {LinkedListNode<T>} */
    	this.tail = tail;
    	this.length = 0;
    }

    /**
     * Adds a new node with the given value to the list.
     * @param {LinkedList<T>} list
     * @param {LinkedListNode<T>} node
     * @param {T} value
     * @returns {LinkedListNode<T>} The added node.
     * @template T
     */
    function addAfter(list, node, value) {
    	// assumes that node != list.tail && values.length >= 0
    	var next = node.next;

    	var newNode = { value: value, prev: node, next: next };
    	node.next = newNode;
    	next.prev = newNode;
    	list.length++;

    	return newNode;
    }
    /**
     * Removes `count` nodes after the given node. The given node will not be removed.
     * @param {LinkedList<T>} list
     * @param {LinkedListNode<T>} node
     * @param {number} count
     * @template T
     */
    function removeRange(list, node, count) {
    	var next = node.next;
    	for (var i = 0; i < count && next !== list.tail; i++) {
    		next = next.next;
    	}
    	node.next = next;
    	next.prev = node;
    	list.length -= i;
    }
    /**
     * @param {LinkedList<T>} list
     * @returns {T[]}
     * @template T
     */
    function toArray(list) {
    	var array = [];
    	var node = list.head.next;
    	while (node !== list.tail) {
    		array.push(node.value);
    		node = node.next;
    	}
    	return array;
    }


    if (!_self.document) {
    	if (!_self.addEventListener) {
    		// in Node.js
    		return _;
    	}

    	if (!_.disableWorkerMessageHandler) {
    		// In worker
    		_self.addEventListener('message', function (evt) {
    			var message = JSON.parse(evt.data),
    				lang = message.language,
    				code = message.code,
    				immediateClose = message.immediateClose;

    			_self.postMessage(_.highlight(code, _.languages[lang], lang));
    			if (immediateClose) {
    				_self.close();
    			}
    		}, false);
    	}

    	return _;
    }

    // Get current script and highlight
    var script = _.util.currentScript();

    if (script) {
    	_.filename = script.src;

    	if (script.hasAttribute('data-manual')) {
    		_.manual = true;
    	}
    }

    function highlightAutomaticallyCallback() {
    	if (!_.manual) {
    		_.highlightAll();
    	}
    }

    if (!_.manual) {
    	// If the document state is "loading", then we'll use DOMContentLoaded.
    	// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
    	// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
    	// might take longer one animation frame to execute which can create a race condition where only some plugins have
    	// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
    	// See https://github.com/PrismJS/prism/issues/2102
    	var readyState = document.readyState;
    	if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
    		document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
    	} else {
    		if (window.requestAnimationFrame) {
    			window.requestAnimationFrame(highlightAutomaticallyCallback);
    		} else {
    			window.setTimeout(highlightAutomaticallyCallback, 16);
    		}
    	}
    }

    return _;

    })(_self);

    if (module.exports) {
    	module.exports = Prism;
    }

    // hack for components to work correctly in node.js
    if (typeof commonjsGlobal !== 'undefined') {
    	commonjsGlobal.Prism = Prism;
    }

    // some additional documentation/types

    /**
     * The expansion of a simple `RegExp` literal to support additional properties.
     *
     * @typedef GrammarToken
     * @property {RegExp} pattern The regular expression of the token.
     * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
     * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
     * @property {boolean} [greedy=false] Whether the token is greedy.
     * @property {string|string[]} [alias] An optional alias or list of aliases.
     * @property {Grammar} [inside] The nested grammar of this token.
     *
     * The `inside` grammar will be used to tokenize the text value of each token of this kind.
     *
     * This can be used to make nested and even recursive language definitions.
     *
     * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
     * each another.
     * @global
     * @public
    */

    /**
     * @typedef Grammar
     * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
     * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
     * @global
     * @public
     */

    /**
     * A function which will invoked after an element was successfully highlighted.
     *
     * @callback HighlightCallback
     * @param {Element} element The element successfully highlighted.
     * @returns {void}
     * @global
     * @public
    */

    /**
     * @callback HookCallback
     * @param {Object<string, any>} env The environment variables of the hook.
     * @returns {void}
     * @global
     * @public
     */


    /* **********************************************
         Begin prism-markup.js
    ********************************************** */

    Prism.languages.markup = {
    	'comment': /<!--[\s\S]*?-->/,
    	'prolog': /<\?[\s\S]+?\?>/,
    	'doctype': {
    		// https://www.w3.org/TR/xml/#NT-doctypedecl
    		pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    		greedy: true,
    		inside: {
    			'internal-subset': {
    				pattern: /(\[)[\s\S]+(?=\]>$)/,
    				lookbehind: true,
    				greedy: true,
    				inside: null // see below
    			},
    			'string': {
    				pattern: /"[^"]*"|'[^']*'/,
    				greedy: true
    			},
    			'punctuation': /^<!|>$|[[\]]/,
    			'doctype-tag': /^DOCTYPE/,
    			'name': /[^\s<>'"]+/
    		}
    	},
    	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
    	'tag': {
    		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    		greedy: true,
    		inside: {
    			'tag': {
    				pattern: /^<\/?[^\s>\/]+/,
    				inside: {
    					'punctuation': /^<\/?/,
    					'namespace': /^[^\s>\/:]+:/
    				}
    			},
    			'attr-value': {
    				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
    				inside: {
    					'punctuation': [
    						{
    							pattern: /^=/,
    							alias: 'attr-equals'
    						},
    						/"|'/
    					]
    				}
    			},
    			'punctuation': /\/?>/,
    			'attr-name': {
    				pattern: /[^\s>\/]+/,
    				inside: {
    					'namespace': /^[^\s>\/:]+:/
    				}
    			}

    		}
    	},
    	'entity': [
    		{
    			pattern: /&[\da-z]{1,8};/i,
    			alias: 'named-entity'
    		},
    		/&#x?[\da-f]{1,8};/i
    	]
    };

    Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
    	Prism.languages.markup['entity'];
    Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

    // Plugin to make entity title show the real entity, idea by Roman Komarov
    Prism.hooks.add('wrap', function (env) {

    	if (env.type === 'entity') {
    		env.attributes['title'] = env.content.replace(/&amp;/, '&');
    	}
    });

    Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    	/**
    	 * Adds an inlined language to markup.
    	 *
    	 * An example of an inlined language is CSS with `<style>` tags.
    	 *
    	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
    	 * case insensitive.
    	 * @param {string} lang The language key.
    	 * @example
    	 * addInlined('style', 'css');
    	 */
    	value: function addInlined(tagName, lang) {
    		var includedCdataInside = {};
    		includedCdataInside['language-' + lang] = {
    			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
    			lookbehind: true,
    			inside: Prism.languages[lang]
    		};
    		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

    		var inside = {
    			'included-cdata': {
    				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    				inside: includedCdataInside
    			}
    		};
    		inside['language-' + lang] = {
    			pattern: /[\s\S]+/,
    			inside: Prism.languages[lang]
    		};

    		var def = {};
    		def[tagName] = {
    			pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
    			lookbehind: true,
    			greedy: true,
    			inside: inside
    		};

    		Prism.languages.insertBefore('markup', 'cdata', def);
    	}
    });

    Prism.languages.html = Prism.languages.markup;
    Prism.languages.mathml = Prism.languages.markup;
    Prism.languages.svg = Prism.languages.markup;

    Prism.languages.xml = Prism.languages.extend('markup', {});
    Prism.languages.ssml = Prism.languages.xml;
    Prism.languages.atom = Prism.languages.xml;
    Prism.languages.rss = Prism.languages.xml;


    /* **********************************************
         Begin prism-css.js
    ********************************************** */

    (function (Prism) {

    	var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

    	Prism.languages.css = {
    		'comment': /\/\*[\s\S]*?\*\//,
    		'atrule': {
    			pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
    			inside: {
    				'rule': /^@[\w-]+/,
    				'selector-function-argument': {
    					pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
    					lookbehind: true,
    					alias: 'selector'
    				},
    				'keyword': {
    					pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
    					lookbehind: true
    				}
    				// See rest below
    			}
    		},
    		'url': {
    			// https://drafts.csswg.org/css-values-3/#urls
    			pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
    			greedy: true,
    			inside: {
    				'function': /^url/i,
    				'punctuation': /^\(|\)$/,
    				'string': {
    					pattern: RegExp('^' + string.source + '$'),
    					alias: 'url'
    				}
    			}
    		},
    		'selector': RegExp('[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
    		'string': {
    			pattern: string,
    			greedy: true
    		},
    		'property': /(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
    		'important': /!important\b/i,
    		'function': /[-a-z0-9]+(?=\()/i,
    		'punctuation': /[(){};:,]/
    	};

    	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

    	var markup = Prism.languages.markup;
    	if (markup) {
    		markup.tag.addInlined('style', 'css');

    		Prism.languages.insertBefore('inside', 'attr-value', {
    			'style-attr': {
    				pattern: /(^|["'\s])style\s*=\s*(?:"[^"]*"|'[^']*')/i,
    				lookbehind: true,
    				inside: {
    					'attr-value': {
    						pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
    						inside: {
    							'style': {
    								pattern: /(["'])[\s\S]+(?=["']$)/,
    								lookbehind: true,
    								alias: 'language-css',
    								inside: Prism.languages.css
    							},
    							'punctuation': [
    								{
    									pattern: /^=/,
    									alias: 'attr-equals'
    								},
    								/"|'/
    							]
    						}
    					},
    					'attr-name': /^style/i
    				}
    			}
    		}, markup.tag);
    	}

    }(Prism));


    /* **********************************************
         Begin prism-clike.js
    ********************************************** */

    Prism.languages.clike = {
    	'comment': [
    		{
    			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
    			lookbehind: true,
    			greedy: true
    		},
    		{
    			pattern: /(^|[^\\:])\/\/.*/,
    			lookbehind: true,
    			greedy: true
    		}
    	],
    	'string': {
    		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    		greedy: true
    	},
    	'class-name': {
    		pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
    		lookbehind: true,
    		inside: {
    			'punctuation': /[.\\]/
    		}
    	},
    	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    	'boolean': /\b(?:true|false)\b/,
    	'function': /\w+(?=\()/,
    	'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    	'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    	'punctuation': /[{}[\];(),.:]/
    };


    /* **********************************************
         Begin prism-javascript.js
    ********************************************** */

    Prism.languages.javascript = Prism.languages.extend('clike', {
    	'class-name': [
    		Prism.languages.clike['class-name'],
    		{
    			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:prototype|constructor))/,
    			lookbehind: true
    		}
    	],
    	'keyword': [
    		{
    			pattern: /((?:^|})\s*)(?:catch|finally)\b/,
    			lookbehind: true
    		},
    		{
    			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|(?:get|set)(?=\s*[\[$\w\xA0-\uFFFF])|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
    			lookbehind: true
    		},
    	],
    	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    	'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    	'number': /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
    	'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    });

    Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

    Prism.languages.insertBefore('javascript', 'keyword', {
    	'regex': {
    		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
    		lookbehind: true,
    		greedy: true,
    		inside: {
    			'regex-source': {
    				pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
    				lookbehind: true,
    				alias: 'language-regex',
    				inside: Prism.languages.regex
    			},
    			'regex-flags': /[a-z]+$/,
    			'regex-delimiter': /^\/|\/$/
    		}
    	},
    	// This must be declared before keyword because we use "function" inside the look-forward
    	'function-variable': {
    		pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
    		alias: 'function'
    	},
    	'parameter': [
    		{
    			pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		}
    	],
    	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    });

    Prism.languages.insertBefore('javascript', 'string', {
    	'template-string': {
    		pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
    		greedy: true,
    		inside: {
    			'template-punctuation': {
    				pattern: /^`|`$/,
    				alias: 'string'
    			},
    			'interpolation': {
    				pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
    				lookbehind: true,
    				inside: {
    					'interpolation-punctuation': {
    						pattern: /^\${|}$/,
    						alias: 'punctuation'
    					},
    					rest: Prism.languages.javascript
    				}
    			},
    			'string': /[\s\S]+/
    		}
    	}
    });

    if (Prism.languages.markup) {
    	Prism.languages.markup.tag.addInlined('script', 'javascript');
    }

    Prism.languages.js = Prism.languages.javascript;


    /* **********************************************
         Begin prism-file-highlight.js
    ********************************************** */

    (function () {
    	if (typeof self === 'undefined' || !self.Prism || !self.document) {
    		return;
    	}

    	// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
    	if (!Element.prototype.matches) {
    		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    	}

    	var Prism = window.Prism;

    	var LOADING_MESSAGE = 'Loading…';
    	var FAILURE_MESSAGE = function (status, message) {
    		return '✖ Error ' + status + ' while fetching file: ' + message;
    	};
    	var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';

    	var EXTENSIONS = {
    		'js': 'javascript',
    		'py': 'python',
    		'rb': 'ruby',
    		'ps1': 'powershell',
    		'psm1': 'powershell',
    		'sh': 'bash',
    		'bat': 'batch',
    		'h': 'c',
    		'tex': 'latex'
    	};

    	var STATUS_ATTR = 'data-src-status';
    	var STATUS_LOADING = 'loading';
    	var STATUS_LOADED = 'loaded';
    	var STATUS_FAILED = 'failed';

    	var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])'
    		+ ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';

    	var lang = /\blang(?:uage)?-([\w-]+)\b/i;

    	/**
    	 * Sets the Prism `language-xxxx` or `lang-xxxx` class to the given language.
    	 *
    	 * @param {HTMLElement} element
    	 * @param {string} language
    	 * @returns {void}
    	 */
    	function setLanguageClass(element, language) {
    		var className = element.className;
    		className = className.replace(lang, ' ') + ' language-' + language;
    		element.className = className.replace(/\s+/g, ' ').trim();
    	}


    	Prism.hooks.add('before-highlightall', function (env) {
    		env.selector += ', ' + SELECTOR;
    	});

    	Prism.hooks.add('before-sanity-check', function (env) {
    		var pre = /** @type {HTMLPreElement} */ (env.element);
    		if (pre.matches(SELECTOR)) {
    			env.code = ''; // fast-path the whole thing and go to complete

    			pre.setAttribute(STATUS_ATTR, STATUS_LOADING); // mark as loading

    			// add code element with loading message
    			var code = pre.appendChild(document.createElement('CODE'));
    			code.textContent = LOADING_MESSAGE;

    			var src = pre.getAttribute('data-src');

    			var language = env.language;
    			if (language === 'none') {
    				// the language might be 'none' because there is no language set;
    				// in this case, we want to use the extension as the language
    				var extension = (/\.(\w+)$/.exec(src) || [, 'none'])[1];
    				language = EXTENSIONS[extension] || extension;
    			}

    			// set language classes
    			setLanguageClass(code, language);
    			setLanguageClass(pre, language);

    			// preload the language
    			var autoloader = Prism.plugins.autoloader;
    			if (autoloader) {
    				autoloader.loadLanguages(language);
    			}

    			// load file
    			var xhr = new XMLHttpRequest();
    			xhr.open('GET', src, true);
    			xhr.onreadystatechange = function () {
    				if (xhr.readyState == 4) {
    					if (xhr.status < 400 && xhr.responseText) {
    						// mark as loaded
    						pre.setAttribute(STATUS_ATTR, STATUS_LOADED);

    						// highlight code
    						code.textContent = xhr.responseText;
    						Prism.highlightElement(code);

    					} else {
    						// mark as failed
    						pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

    						if (xhr.status >= 400) {
    							code.textContent = FAILURE_MESSAGE(xhr.status, xhr.statusText);
    						} else {
    							code.textContent = FAILURE_EMPTY_MESSAGE;
    						}
    					}
    				}
    			};
    			xhr.send(null);
    		}
    	});

    	Prism.plugins.fileHighlight = {
    		/**
    		 * Executes the File Highlight plugin for all matching `pre` elements under the given container.
    		 *
    		 * Note: Elements which are already loaded or currently loading will not be touched by this method.
    		 *
    		 * @param {ParentNode} [container=document]
    		 */
    		highlight: function highlight(container) {
    			var elements = (container || document).querySelectorAll(SELECTOR);

    			for (var i = 0, element; element = elements[i++];) {
    				Prism.highlightElement(element);
    			}
    		}
    	};

    	var logged = false;
    	/** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */
    	Prism.fileHighlight = function () {
    		if (!logged) {
    			console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
    			logged = true;
    		}
    		Prism.plugins.fileHighlight.highlight.apply(this, arguments);
    	};

    })();
    }(prism));

    var Prism$1 = prism.exports;

    var prismNormalizeWhitespace$1 = {exports: {}};

    (function (module) {
    (function() {

    var assign = Object.assign || function (obj1, obj2) {
    	for (var name in obj2) {
    		if (obj2.hasOwnProperty(name))
    			obj1[name] = obj2[name];
    	}
    	return obj1;
    };

    function NormalizeWhitespace(defaults) {
    	this.defaults = assign({}, defaults);
    }

    function toCamelCase(value) {
    	return value.replace(/-(\w)/g, function(match, firstChar) {
    		return firstChar.toUpperCase();
    	});
    }

    function tabLen(str) {
    	var res = 0;
    	for (var i = 0; i < str.length; ++i) {
    		if (str.charCodeAt(i) == '\t'.charCodeAt(0))
    			res += 3;
    	}
    	return str.length + res;
    }

    NormalizeWhitespace.prototype = {
    	setDefaults: function (defaults) {
    		this.defaults = assign(this.defaults, defaults);
    	},
    	normalize: function (input, settings) {
    		settings = assign(this.defaults, settings);

    		for (var name in settings) {
    			var methodName = toCamelCase(name);
    			if (name !== "normalize" && methodName !== 'setDefaults' &&
    					settings[name] && this[methodName]) {
    				input = this[methodName].call(this, input, settings[name]);
    			}
    		}

    		return input;
    	},

    	/*
    	 * Normalization methods
    	 */
    	leftTrim: function (input) {
    		return input.replace(/^\s+/, '');
    	},
    	rightTrim: function (input) {
    		return input.replace(/\s+$/, '');
    	},
    	tabsToSpaces: function (input, spaces) {
    		spaces = spaces|0 || 4;
    		return input.replace(/\t/g, new Array(++spaces).join(' '));
    	},
    	spacesToTabs: function (input, spaces) {
    		spaces = spaces|0 || 4;
    		return input.replace(RegExp(' {' + spaces + '}', 'g'), '\t');
    	},
    	removeTrailing: function (input) {
    		return input.replace(/\s*?$/gm, '');
    	},
    	// Support for deprecated plugin remove-initial-line-feed
    	removeInitialLineFeed: function (input) {
    		return input.replace(/^(?:\r?\n|\r)/, '');
    	},
    	removeIndent: function (input) {
    		var indents = input.match(/^[^\S\n\r]*(?=\S)/gm);

    		if (!indents || !indents[0].length)
    			return input;

    		indents.sort(function(a, b){return a.length - b.length; });

    		if (!indents[0].length)
    			return input;

    		return input.replace(RegExp('^' + indents[0], 'gm'), '');
    	},
    	indent: function (input, tabs) {
    		return input.replace(/^[^\S\n\r]*(?=\S)/gm, new Array(++tabs).join('\t') + '$&');
    	},
    	breakLines: function (input, characters) {
    		characters = (characters === true) ? 80 : characters|0 || 80;

    		var lines = input.split('\n');
    		for (var i = 0; i < lines.length; ++i) {
    			if (tabLen(lines[i]) <= characters)
    				continue;

    			var line = lines[i].split(/(\s+)/g),
    			    len = 0;

    			for (var j = 0; j < line.length; ++j) {
    				var tl = tabLen(line[j]);
    				len += tl;
    				if (len > characters) {
    					line[j] = '\n' + line[j];
    					len = tl;
    				}
    			}
    			lines[i] = line.join('');
    		}
    		return lines.join('\n');
    	}
    };

    // Support node modules
    if (module.exports) {
    	module.exports = NormalizeWhitespace;
    }

    // Exit if prism is not loaded
    if (typeof Prism === 'undefined') {
    	return;
    }

    Prism.plugins.NormalizeWhitespace = new NormalizeWhitespace({
    	'remove-trailing': true,
    	'remove-indent': true,
    	'left-trim': true,
    	'right-trim': true,
    	/*'break-lines': 80,
    	'indent': 2,
    	'remove-initial-line-feed': false,
    	'tabs-to-spaces': 4,
    	'spaces-to-tabs': 4*/
    });

    Prism.hooks.add('before-sanity-check', function (env) {
    	var Normalizer = Prism.plugins.NormalizeWhitespace;

    	// Check settings
    	if (env.settings && env.settings['whitespace-normalization'] === false) {
    		return;
    	}

    	// Check classes
    	if (!Prism.util.isActive(env.element, 'whitespace-normalization', true)) {
    		return;
    	}

    	// Simple mode if there is no env.element
    	if ((!env.element || !env.element.parentNode) && env.code) {
    		env.code = Normalizer.normalize(env.code, env.settings);
    		return;
    	}

    	// Normal mode
    	var pre = env.element.parentNode;
    	if (!env.code || !pre || pre.nodeName.toLowerCase() !== 'pre') {
    		return;
    	}

    	var children = pre.childNodes,
    	    before = '',
    	    after = '',
    	    codeFound = false;

    	// Move surrounding whitespace from the <pre> tag into the <code> tag
    	for (var i = 0; i < children.length; ++i) {
    		var node = children[i];

    		if (node == env.element) {
    			codeFound = true;
    		} else if (node.nodeName === "#text") {
    			if (codeFound) {
    				after += node.nodeValue;
    			} else {
    				before += node.nodeValue;
    			}

    			pre.removeChild(node);
    			--i;
    		}
    	}

    	if (!env.element.children.length || !Prism.plugins.KeepMarkup) {
    		env.code = before + env.code + after;
    		env.code = Normalizer.normalize(env.code, env.settings);
    	} else {
    		// Preserve markup for keep-markup plugin
    		var html = before + env.element.innerHTML + after;
    		env.element.innerHTML = Normalizer.normalize(html, env.settings);
    		env.code = env.element.textContent;
    	}
    });

    }());
    }(prismNormalizeWhitespace$1));

    var prismNormalizeWhitespace = prismNormalizeWhitespace$1.exports;

    var plugins = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), prismNormalizeWhitespace$1.exports, {
        'default': prismNormalizeWhitespace
    }));

    /* src/components/ThemePreview.svelte generated by Svelte v3.38.2 */
    const file$5 = "src/components/ThemePreview.svelte";

    function add_css$5() {
    	var style = element("style");
    	style.id = "svelte-ruj94d-style";
    	style.textContent = ".preview.svelte-ruj94d{padding:.5em;color:var(--fg);overflow:auto;outline:none;line-height:calc(16 / var(--font-size, 14))}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGhlbWVQcmV2aWV3LnN2ZWx0ZSIsInNvdXJjZXMiOlsiVGhlbWVQcmV2aWV3LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c3R5bGU+XG4gICAgLnByZXZpZXcge1xuICAgICAgICBwYWRkaW5nOiAuNWVtO1xuICAgICAgICBjb2xvcjogdmFyKC0tZmcpO1xuICAgICAgICBvdmVyZmxvdzogYXV0bztcbiAgICAgICAgb3V0bGluZTogbm9uZTtcbiAgICAgICAgbGluZS1oZWlnaHQ6IGNhbGMoMTYgLyB2YXIoLS1mb250LXNpemUsIDE0KSk7XG4gICAgfVxuPC9zdHlsZT5cblxuPHNjcmlwdD5cbiAgICBpbXBvcnQgUHJpc20gZnJvbSAncHJpc21qcyc7XG4gICAgaW1wb3J0ICogYXMgcGx1Z2lucyBmcm9tICdwcmlzbWpzL3BsdWdpbnMvbm9ybWFsaXplLXdoaXRlc3BhY2UvcHJpc20tbm9ybWFsaXplLXdoaXRlc3BhY2UnO1xuXG4gICAgUHJpc20ucGx1Z2lucy5Ob3JtYWxpemVXaGl0ZXNwYWNlLnNldERlZmF1bHRzKHtcbiAgICAgICAgJ3JlbW92ZS10cmFpbGluZyc6IGZhbHNlLFxuICAgICAgICAncmVtb3ZlLWluZGVudCc6IGZhbHNlLFxuICAgICAgICAnbGVmdC10cmltJzogZmFsc2UsXG4gICAgICAgICdyaWdodC10cmltJzogdHJ1ZSxcbiAgICAgICAgJ3JlbW92ZS1pbml0aWFsLWxpbmUtZmVlZCc6IGZhbHNlLFxuICAgIH0pO1xuICAgIGNvbnN0IG53ID0gUHJpc20ucGx1Z2lucy5Ob3JtYWxpemVXaGl0ZXNwYWNlO1xuXG4gICAgbGV0IGpzID0gYC8vIEphdmFzY3JpcHQgQ29kZTpcbmZ1bmN0aW9uIGZvbyhwKSB7XG4gIGNvbnNvbGUubG9nKCdmb28nKTtcbiAgcmV0dXJuIDEwO1xufVxuYDtcblxuICAgIGxldCBodG1sQ29kZSA9IGBcbjwhLS0gSFRNTCBDb2RlIC0tPlxuPGRpdiBjbGFzcz1cImZvb1wiIGlkPVwiZm9vXCI+XG4gICAgPHA+VGhpcyBpcyBhIGNvbnRlbnQ8L3A+XG48L2Rpdj5cbmA7XG5cbiAgICBleHBvcnQgbGV0IGNvZGUgPSBQcmlzbS5oaWdobGlnaHQobncubm9ybWFsaXplKGpzKSwgUHJpc20ubGFuZ3VhZ2VzLmphdmFzY3JpcHQsICdqYXZhc2NyaXB0Jyk7XG4gICAgZXhwb3J0IGxldCBodG1sID0gUHJpc20uaGlnaGxpZ2h0KG53Lm5vcm1hbGl6ZShodG1sQ29kZSksIFByaXNtLmxhbmd1YWdlcy5tYXJrdXAsICdodG1sJyk7XG48L3NjcmlwdD5cblxuPHByZSBjbGFzcz1cInByZXZpZXdcIiBjb250ZW50ZWRpdGFibGU+XG4gICAgPGNvZGUgY2xhc3M9XCJsYW5ndWFnZS1qYXZhc2NyaXB0XCI+e0BodG1sIGNvZGV9PC9jb2RlPlxuICAgIDxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtaHRtbFwiPntAaHRtbCBodG1sfTwvY29kZT5cbjwvcHJlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNJLFFBQVEsY0FBQyxDQUFDLEFBQ04sT0FBTyxDQUFFLElBQUksQ0FDYixLQUFLLENBQUUsSUFBSSxJQUFJLENBQUMsQ0FDaEIsUUFBUSxDQUFFLElBQUksQ0FDZCxPQUFPLENBQUUsSUFBSSxDQUNiLFdBQVcsQ0FBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQUFDaEQsQ0FBQyJ9 */";
    	append_dev(document.head, style);
    }

    function create_fragment$5(ctx) {
    	let pre;
    	let code0;
    	let t;
    	let code1;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			code0 = element("code");
    			t = text("\n    ");
    			code1 = element("code");
    			this.h();
    		},
    		l: function claim(nodes) {
    			pre = claim_element(nodes, "PRE", { class: true, contenteditable: true });
    			var pre_nodes = children(pre);
    			code0 = claim_element(pre_nodes, "CODE", { class: true });
    			var code0_nodes = children(code0);
    			code0_nodes.forEach(detach_dev);
    			t = claim_text(pre_nodes, "\n    ");
    			code1 = claim_element(pre_nodes, "CODE", { class: true });
    			var code1_nodes = children(code1);
    			code1_nodes.forEach(detach_dev);
    			pre_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(code0, "class", "language-javascript");
    			add_location(code0, file$5, 42, 4, 1051);
    			attr_dev(code1, "class", "language-html");
    			add_location(code1, file$5, 43, 4, 1109);
    			attr_dev(pre, "class", "preview svelte-ruj94d");
    			attr_dev(pre, "contenteditable", "");
    			add_location(pre, file$5, 41, 0, 1009);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    			append_dev(pre, code0);
    			code0.innerHTML = /*code*/ ctx[0];
    			append_dev(pre, t);
    			append_dev(pre, code1);
    			code1.innerHTML = /*html*/ ctx[1];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*code*/ 1) code0.innerHTML = /*code*/ ctx[0];			if (dirty & /*html*/ 2) code1.innerHTML = /*html*/ ctx[1];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ThemePreview", slots, []);

    	Prism$1.plugins.NormalizeWhitespace.setDefaults({
    		"remove-trailing": false,
    		"remove-indent": false,
    		"left-trim": false,
    		"right-trim": true,
    		"remove-initial-line-feed": false
    	});

    	const nw = Prism$1.plugins.NormalizeWhitespace;

    	let js = `// Javascript Code:
function foo(p) {
  console.log('foo');
  return 10;
}
`;

    	let htmlCode = `
<!-- HTML Code -->
<div class="foo" id="foo">
    <p>This is a content</p>
</div>
`;

    	let { code = Prism$1.highlight(nw.normalize(js), Prism$1.languages.javascript, "javascript") } = $$props;
    	let { html = Prism$1.highlight(nw.normalize(htmlCode), Prism$1.languages.markup, "html") } = $$props;
    	const writable_props = ["code", "html"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ThemePreview> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("code" in $$props) $$invalidate(0, code = $$props.code);
    		if ("html" in $$props) $$invalidate(1, html = $$props.html);
    	};

    	$$self.$capture_state = () => ({
    		Prism: Prism$1,
    		plugins,
    		nw,
    		js,
    		htmlCode,
    		code,
    		html
    	});

    	$$self.$inject_state = $$props => {
    		if ("js" in $$props) js = $$props.js;
    		if ("htmlCode" in $$props) htmlCode = $$props.htmlCode;
    		if ("code" in $$props) $$invalidate(0, code = $$props.code);
    		if ("html" in $$props) $$invalidate(1, html = $$props.html);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [code, html];
    }

    class ThemePreview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-ruj94d-style")) add_css$5();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { code: 0, html: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThemePreview",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get code() {
    		throw new Error("<ThemePreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<ThemePreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get html() {
    		throw new Error("<ThemePreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set html(value) {
    		throw new Error("<ThemePreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function throttle(callback, wait = 0, { start = true, middle = true, once = false } = {}) {
        let last = 0;
        let timer;
        let cancelled = false;
        function fn(...args) {
            if (cancelled)
                return;
            const delta = Date.now() - last;
            last = Date.now();
            if (start) {
                start = false;
                callback.apply(this, args);
                if (once)
                    fn.cancel();
            }
            else if ((middle && delta < wait) || !middle) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    last = Date.now();
                    callback.apply(this, args);
                    if (once)
                        fn.cancel();
                }, !middle ? wait : wait - delta);
            }
        }
        fn.cancel = () => {
            clearTimeout(timer);
            cancelled = true;
        };
        return fn;
    }
    function debounce(callback, wait = 0, { start = false, middle = false, once = false } = {}) {
        return throttle(callback, wait, { start, middle, once });
    }

    /* src/components/FontSettings.svelte generated by Svelte v3.38.2 */
    const file$4 = "src/components/FontSettings.svelte";

    function add_css$4() {
    	var style = element("style");
    	style.id = "svelte-kehiie-style";
    	style.textContent = ".font-setting.svelte-kehiie.svelte-kehiie{display:block;margin:1rem auto}.font-setting.svelte-kehiie label.svelte-kehiie{display:block;text-align:left;margin-bottom:0.5em}.font-setting.svelte-kehiie input.svelte-kehiie{display:block;background-image:none}.font-family.svelte-kehiie input.svelte-kehiie{font-size:0.875rem}.color-preview.svelte-kehiie.svelte-kehiie{padding:3px;color:white;border-radius:10px}.font-setting.svelte-kehiie .accent-color-input.svelte-kehiie{border:none;display:inline-block}.accent-reset-button.svelte-kehiie.svelte-kehiie{background:var(--button);color:var(--text);border-radius:0;padding:.5em;text-transform:uppercase;border:0;transition:all .3s;outline:none}.accent-reset-button.svelte-kehiie.svelte-kehiie:hover{background:var(--hl);color:var(--selection-fg-color)}.accent-color-wrapper.svelte-kehiie.svelte-kehiie{display:flex;justify-content:space-between}input[type=\"color\"].svelte-kehiie.svelte-kehiie{-webkit-appearance:none;width:32px;height:32px;border-radius:50%}input[type=\"color\"].svelte-kehiie.svelte-kehiie::-webkit-color-swatch-wrapper{padding:0;border-radius:50%}input[type=\"color\"].svelte-kehiie.svelte-kehiie::-webkit-color-swatch{border-color:var(--border);border-radius:50%}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRm9udFNldHRpbmdzLnN2ZWx0ZSIsInNvdXJjZXMiOlsiRm9udFNldHRpbmdzLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQge2FwcH0gZnJvbSAnLi4vJGFwcCc7XG4gIGltcG9ydCB7c3R5bGVCdWlsZGVyfSBmcm9tICcuLi9zdHlsZS1idWlsZGVyJztcbiAgaW1wb3J0IHtkZWJvdW5jZX0gZnJvbSAnQGdpdGh1Yi9taW5pLXRocm90dGxlJztcblxuICBmdW5jdGlvbiBhcHBseVRoZW1lKCkge1xuICAgIHN0eWxlQnVpbGRlci5hcHBseVRoZW1lKFxuICAgICAge1xuICAgICAgICBjdXJyZW50VGhlbWU6ICRhcHAuY3VycmVudFRoZW1lLFxuICAgICAgICBjdXJyZW50Rm9udEZhbWlseTogJGFwcC5jdXJyZW50Rm9udEZhbWlseSxcbiAgICAgICAgY3VycmVudEZvbnRTaXplOiAkYXBwLmN1cnJlbnRGb250U2l6ZSxcbiAgICAgICAgYWNjZW50Q29sb3I6ICRhcHAuY3VycmVudEFjY2VudENvbG9yLFxuICAgICAgfSk7XG4gIH1cblxuICBjb25zdCBkZWJvdW5jZWRBcHBseSA9IGRlYm91bmNlKGFwcGx5VGhlbWUsIDMwMCk7XG5cbiAgZnVuY3Rpb24gcmVzZXRBY2NlbnQoKSB7XG4gICAgJGFwcC5yZXNldEFjY2VudCgpO1xuICAgIGFwcGx5VGhlbWUoKTtcbiAgfVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbiAgLmZvbnQtc2V0dGluZyB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgbWFyZ2luOiAxcmVtIGF1dG87XG4gIH1cblxuICAuZm9udC1zZXR0aW5nIGxhYmVsIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuICAgIG1hcmdpbi1ib3R0b206IDAuNWVtO1xuICB9XG5cbiAgLmZvbnQtc2V0dGluZyBpbnB1dCB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgYmFja2dyb3VuZC1pbWFnZTogbm9uZTtcbiAgfVxuXG4gIC5mb250LWZhbWlseSBpbnB1dCB7XG4gICAgZm9udC1zaXplOiAwLjg3NXJlbTtcbiAgfVxuXG4gIC5jb2xvci1wcmV2aWV3IHtcbiAgICBwYWRkaW5nOiAzcHg7XG4gICAgY29sb3I6IHdoaXRlO1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gIH1cblxuICAuZm9udC1zZXR0aW5nIC5hY2NlbnQtY29sb3ItaW5wdXQge1xuICAgIGJvcmRlcjogbm9uZTtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIH1cblxuICAuYWNjZW50LXJlc2V0LWJ1dHRvbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tYnV0dG9uKTtcbiAgICBjb2xvcjogdmFyKC0tdGV4dCk7XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICBwYWRkaW5nOiAuNWVtO1xuICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgYm9yZGVyOiAwO1xuICAgIHRyYW5zaXRpb246IGFsbCAuM3M7XG4gICAgb3V0bGluZTogbm9uZTtcbiAgfVxuXG4gIC5hY2NlbnQtcmVzZXQtYnV0dG9uOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1obCk7XG4gICAgY29sb3I6IHZhcigtLXNlbGVjdGlvbi1mZy1jb2xvcik7XG4gIH1cblxuICAuYWNjZW50LWNvbG9yLXdyYXBwZXIge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICB9XG5cbiAgaW5wdXRbdHlwZT1cImNvbG9yXCJdIHtcbiAgICAtd2Via2l0LWFwcGVhcmFuY2U6IG5vbmU7XG4gICAgd2lkdGg6IDMycHg7XG4gICAgaGVpZ2h0OiAzMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwJTtcbiAgfVxuXG4gIGlucHV0W3R5cGU9XCJjb2xvclwiXTo6LXdlYmtpdC1jb2xvci1zd2F0Y2gtd3JhcHBlciB7XG4gICAgcGFkZGluZzogMDtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gIH1cblxuICBpbnB1dFt0eXBlPVwiY29sb3JcIl06Oi13ZWJraXQtY29sb3Itc3dhdGNoIHtcbiAgICBib3JkZXItY29sb3I6IHZhcigtLWJvcmRlcik7XG4gICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICB9XG48L3N0eWxlPlxuXG48ZGl2IGNsYXNzPVwiZm9udC1zZXR0aW5nIGZvbnQtZmFtaWx5XCI+XG4gICAgPGxhYmVsIGZvcj1cImZvbnQtZmFtaWx5LWlucHV0XCI+Rm9udCBGYW1pbHk6XG4gICAgICAgIDxzcGFuIHN0eWxlPVwiZm9udC1mYW1pbHk6ICd7JGFwcC5jdXJyZW50Rm9udEZhbWlseX0nXCI+eyRhcHAuY3VycmVudEZvbnRGYW1pbHl9PC9zcGFuPlxuICAgIDwvbGFiZWw+XG5cbiAgICA8aW5wdXQgaWQ9XCJmb250LWZhbWlseS1pbnB1dFwiXG4gICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgb246Y2hhbmdlPVwie2RlYm91bmNlZEFwcGx5fVwiXG4gICAgICAgICAgIGJpbmQ6dmFsdWU9XCJ7JGFwcC5jdXJyZW50Rm9udEZhbWlseX1cIlxuICAgICAgICAgICBwbGFjZWhvbGRlcj1cImUuZy4gTWVubG9cIiAvPlxuPC9kaXY+XG5cbjxkaXYgY2xhc3M9XCJmb250LXNldHRpbmcgZm9udC1zaXplXCI+XG4gICAgPGxhYmVsIGZvcj1cImZvbnQtc2l6ZS1pbnB1dFwiPkZvbnQgc2l6ZTpcbiAgICAgICAgPG91dHB1dCBpZD1cImZvbnQtc2l6ZS1vdXRwdXRcIiBmb3I9XCJmb250LXNpemUtaW5wdXRcIj57JGFwcC5jdXJyZW50Rm9udFNpemV9PC9vdXRwdXQ+XG4gICAgICAgIHB4XG4gICAgPC9sYWJlbD5cblxuICAgIDxpbnB1dCBpZD1cImZvbnQtc2l6ZS1pbnB1dFwiIHR5cGU9XCJyYW5nZVwiXG4gICAgICAgICAgIG1pbj1cIjEwXCJcbiAgICAgICAgICAgbWF4PVwiMjJcIlxuICAgICAgICAgICBvbjpjaGFuZ2U9XCJ7ZGVib3VuY2VkQXBwbHl9XCJcbiAgICAgICAgICAgYmluZDp2YWx1ZT1cInskYXBwLmN1cnJlbnRGb250U2l6ZX1cIiAvPlxuPC9kaXY+XG5cbjxkaXYgY2xhc3M9XCJmb250LXNldHRpbmcgYWNjZW50LWNvbG9yXCI+XG4gICAgPGxhYmVsIGZvcj1cImNvbG9yXCI+QWNjZW50IENvbG9yOlxuICAgICAgICA8bWFyayBjbGFzcz1cImNvbG9yLXByZXZpZXdcIiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6IHskYXBwLmN1cnJlbnRBY2NlbnRDb2xvciB8fCAkYXBwLmN1cnJlbnRUaGVtZT8uYWNjZW50fVwiPlxuICAgICAgICAgICAgeyRhcHAuY3VycmVudEFjY2VudENvbG9yIHx8ICdEZWZhdWx0J31cbiAgICAgICAgPC9tYXJrPlxuICAgIDwvbGFiZWw+XG5cbiAgICA8ZGl2IGNsYXNzPVwiYWNjZW50LWNvbG9yLXdyYXBwZXJcIj5cbiAgICAgICAgeyNpZiAkYXBwLmN1cnJlbnRBY2NlbnRDb2xvciA9PSBudWxsfVxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjb2xvclwiXG4gICAgICAgICAgICAgICAgICAgaWQ9XCJjb2xvclwiXG4gICAgICAgICAgICAgICAgICAgY2xhc3M9XCJhY2NlbnQtY29sb3ItaW5wdXRcIlxuICAgICAgICAgICAgICAgICAgIG9uOmNoYW5nZT17ZGVib3VuY2VkQXBwbHl9XG4gICAgICAgICAgICAgICAgICAgYmluZDp2YWx1ZT17JGFwcC5jdXJyZW50QWNjZW50Q29sb3J9IC8+XG4gICAgICAgIHs6ZWxzZX1cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY29sb3JcIlxuICAgICAgICAgICAgICAgICAgIGlkPVwiY29sb3JcIlxuICAgICAgICAgICAgICAgICAgIGNsYXNzPVwiYWNjZW50LWNvbG9yLWlucHV0XCJcbiAgICAgICAgICAgICAgICAgICBvbjpjaGFuZ2U9e2RlYm91bmNlZEFwcGx5fVxuICAgICAgICAgICAgICAgICAgIGJpbmQ6dmFsdWU9eyRhcHAuY3VycmVudEFjY2VudENvbG9yfSAvPlxuICAgICAgICB7L2lmfVxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYWNjZW50LXJlc2V0LWJ1dHRvblwiIG9uOmNsaWNrPXtyZXNldEFjY2VudH0+UmVzZXQgdG8gZGVmYXVsdDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXdCRSxhQUFhLDRCQUFDLENBQUMsQUFDYixPQUFPLENBQUUsS0FBSyxDQUNkLE1BQU0sQ0FBRSxJQUFJLENBQUMsSUFBSSxBQUNuQixDQUFDLEFBRUQsMkJBQWEsQ0FBQyxLQUFLLGNBQUMsQ0FBQyxBQUNuQixPQUFPLENBQUUsS0FBSyxDQUNkLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLGFBQWEsQ0FBRSxLQUFLLEFBQ3RCLENBQUMsQUFFRCwyQkFBYSxDQUFDLEtBQUssY0FBQyxDQUFDLEFBQ25CLE9BQU8sQ0FBRSxLQUFLLENBQ2QsZ0JBQWdCLENBQUUsSUFBSSxBQUN4QixDQUFDLEFBRUQsMEJBQVksQ0FBQyxLQUFLLGNBQUMsQ0FBQyxBQUNsQixTQUFTLENBQUUsUUFBUSxBQUNyQixDQUFDLEFBRUQsY0FBYyw0QkFBQyxDQUFDLEFBQ2QsT0FBTyxDQUFFLEdBQUcsQ0FDWixLQUFLLENBQUUsS0FBSyxDQUNaLGFBQWEsQ0FBRSxJQUFJLEFBQ3JCLENBQUMsQUFFRCwyQkFBYSxDQUFDLG1CQUFtQixjQUFDLENBQUMsQUFDakMsTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsWUFBWSxBQUN2QixDQUFDLEFBRUQsb0JBQW9CLDRCQUFDLENBQUMsQUFDcEIsVUFBVSxDQUFFLElBQUksUUFBUSxDQUFDLENBQ3pCLEtBQUssQ0FBRSxJQUFJLE1BQU0sQ0FBQyxDQUNsQixhQUFhLENBQUUsQ0FBQyxDQUNoQixPQUFPLENBQUUsSUFBSSxDQUNiLGNBQWMsQ0FBRSxTQUFTLENBQ3pCLE1BQU0sQ0FBRSxDQUFDLENBQ1QsVUFBVSxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQ25CLE9BQU8sQ0FBRSxJQUFJLEFBQ2YsQ0FBQyxBQUVELGdEQUFvQixNQUFNLEFBQUMsQ0FBQyxBQUMxQixVQUFVLENBQUUsSUFBSSxJQUFJLENBQUMsQ0FDckIsS0FBSyxDQUFFLElBQUksb0JBQW9CLENBQUMsQUFDbEMsQ0FBQyxBQUVELHFCQUFxQiw0QkFBQyxDQUFDLEFBQ3JCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsZUFBZSxDQUFFLGFBQWEsQUFDaEMsQ0FBQyxBQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUFDLENBQUMsQUFDbkIsa0JBQWtCLENBQUUsSUFBSSxDQUN4QixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osYUFBYSxDQUFFLEdBQUcsQUFDcEIsQ0FBQyxBQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyw2QkFBQyw4QkFBOEIsQUFBQyxDQUFDLEFBQ2pELE9BQU8sQ0FBRSxDQUFDLENBQ1YsYUFBYSxDQUFFLEdBQUcsQUFDcEIsQ0FBQyxBQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyw2QkFBQyxzQkFBc0IsQUFBQyxDQUFDLEFBQ3pDLFlBQVksQ0FBRSxJQUFJLFFBQVEsQ0FBQyxDQUMzQixhQUFhLENBQUUsR0FBRyxBQUNwQixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    // (134:8) {:else}
    function create_else_block$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			this.h();
    		},
    		l: function claim(nodes) {
    			input = claim_element(nodes, "INPUT", { type: true, id: true, class: true });
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(input, "type", "color");
    			attr_dev(input, "id", "color");
    			attr_dev(input, "class", "accent-color-input svelte-kehiie");
    			add_location(input, file$4, 134, 12, 3122);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$app*/ ctx[0].currentAccentColor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*debouncedApply*/ ctx[1], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$app*/ 1) {
    				set_input_value(input, /*$app*/ ctx[0].currentAccentColor);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(134:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (128:8) {#if $app.currentAccentColor == null}
    function create_if_block$4(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			this.h();
    		},
    		l: function claim(nodes) {
    			input = claim_element(nodes, "INPUT", { type: true, id: true, class: true });
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(input, "type", "color");
    			attr_dev(input, "id", "color");
    			attr_dev(input, "class", "accent-color-input svelte-kehiie");
    			add_location(input, file$4, 128, 12, 2893);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$app*/ ctx[0].currentAccentColor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*debouncedApply*/ ctx[1], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$app*/ 1) {
    				set_input_value(input, /*$app*/ ctx[0].currentAccentColor);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(128:8) {#if $app.currentAccentColor == null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let label0;
    	let t0;
    	let span;
    	let t1_value = /*$app*/ ctx[0].currentFontFamily + "";
    	let t1;
    	let t2;
    	let input0;
    	let t3;
    	let div1;
    	let label1;
    	let t4;
    	let output;
    	let t5_value = /*$app*/ ctx[0].currentFontSize + "";
    	let t5;
    	let t6;
    	let t7;
    	let input1;
    	let t8;
    	let div3;
    	let label2;
    	let t9;
    	let mark;
    	let t10_value = (/*$app*/ ctx[0].currentAccentColor || "Default") + "";
    	let t10;
    	let t11;
    	let div2;
    	let t12;
    	let button;
    	let t13;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$app*/ ctx[0].currentAccentColor == null) return create_if_block$4;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Font Family:\n        ");
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			div1 = element("div");
    			label1 = element("label");
    			t4 = text("Font size:\n        ");
    			output = element("output");
    			t5 = text(t5_value);
    			t6 = text("\n        px");
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			div3 = element("div");
    			label2 = element("label");
    			t9 = text("Accent Color:\n        ");
    			mark = element("mark");
    			t10 = text(t10_value);
    			t11 = space();
    			div2 = element("div");
    			if_block.c();
    			t12 = space();
    			button = element("button");
    			t13 = text("Reset to default");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div0 = claim_element(nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			label0 = claim_element(div0_nodes, "LABEL", { for: true, class: true });
    			var label0_nodes = children(label0);
    			t0 = claim_text(label0_nodes, "Font Family:\n        ");
    			span = claim_element(label0_nodes, "SPAN", { style: true });
    			var span_nodes = children(span);
    			t1 = claim_text(span_nodes, t1_value);
    			span_nodes.forEach(detach_dev);
    			label0_nodes.forEach(detach_dev);
    			t2 = claim_space(div0_nodes);

    			input0 = claim_element(div0_nodes, "INPUT", {
    				id: true,
    				type: true,
    				placeholder: true,
    				class: true
    			});

    			div0_nodes.forEach(detach_dev);
    			t3 = claim_space(nodes);
    			div1 = claim_element(nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			label1 = claim_element(div1_nodes, "LABEL", { for: true, class: true });
    			var label1_nodes = children(label1);
    			t4 = claim_text(label1_nodes, "Font size:\n        ");
    			output = claim_element(label1_nodes, "OUTPUT", { id: true, for: true });
    			var output_nodes = children(output);
    			t5 = claim_text(output_nodes, t5_value);
    			output_nodes.forEach(detach_dev);
    			t6 = claim_text(label1_nodes, "\n        px");
    			label1_nodes.forEach(detach_dev);
    			t7 = claim_space(div1_nodes);

    			input1 = claim_element(div1_nodes, "INPUT", {
    				id: true,
    				type: true,
    				min: true,
    				max: true,
    				class: true
    			});

    			div1_nodes.forEach(detach_dev);
    			t8 = claim_space(nodes);
    			div3 = claim_element(nodes, "DIV", { class: true });
    			var div3_nodes = children(div3);
    			label2 = claim_element(div3_nodes, "LABEL", { for: true, class: true });
    			var label2_nodes = children(label2);
    			t9 = claim_text(label2_nodes, "Accent Color:\n        ");
    			mark = claim_element(label2_nodes, "MARK", { class: true, style: true });
    			var mark_nodes = children(mark);
    			t10 = claim_text(mark_nodes, t10_value);
    			mark_nodes.forEach(detach_dev);
    			label2_nodes.forEach(detach_dev);
    			t11 = claim_space(div3_nodes);
    			div2 = claim_element(div3_nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			if_block.l(div2_nodes);
    			t12 = claim_space(div2_nodes);
    			button = claim_element(div2_nodes, "BUTTON", { class: true });
    			var button_nodes = children(button);
    			t13 = claim_text(button_nodes, "Reset to default");
    			button_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			div3_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			set_style(span, "font-family", "'" + /*$app*/ ctx[0].currentFontFamily + "'");
    			add_location(span, file$4, 96, 8, 1846);
    			attr_dev(label0, "for", "font-family-input");
    			attr_dev(label0, "class", "svelte-kehiie");
    			add_location(label0, file$4, 95, 4, 1794);
    			attr_dev(input0, "id", "font-family-input");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "e.g. Menlo");
    			attr_dev(input0, "class", "svelte-kehiie");
    			add_location(input0, file$4, 99, 4, 1950);
    			attr_dev(div0, "class", "font-setting font-family svelte-kehiie");
    			add_location(div0, file$4, 94, 0, 1751);
    			attr_dev(output, "id", "font-size-output");
    			attr_dev(output, "for", "font-size-input");
    			add_location(output, file$4, 108, 8, 2228);
    			attr_dev(label1, "for", "font-size-input");
    			attr_dev(label1, "class", "svelte-kehiie");
    			add_location(label1, file$4, 107, 4, 2180);
    			attr_dev(input1, "id", "font-size-input");
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "10");
    			attr_dev(input1, "max", "22");
    			attr_dev(input1, "class", "svelte-kehiie");
    			add_location(input1, file$4, 112, 4, 2341);
    			attr_dev(div1, "class", "font-setting font-size svelte-kehiie");
    			add_location(div1, file$4, 106, 0, 2139);
    			attr_dev(mark, "class", "color-preview svelte-kehiie");
    			set_style(mark, "background-color", /*$app*/ ctx[0].currentAccentColor || /*$app*/ ctx[0].currentTheme?.accent);
    			add_location(mark, file$4, 121, 8, 2605);
    			attr_dev(label2, "for", "color");
    			attr_dev(label2, "class", "svelte-kehiie");
    			add_location(label2, file$4, 120, 4, 2564);
    			attr_dev(button, "class", "accent-reset-button svelte-kehiie");
    			add_location(button, file$4, 140, 8, 3345);
    			attr_dev(div2, "class", "accent-color-wrapper svelte-kehiie");
    			add_location(div2, file$4, 126, 4, 2800);
    			attr_dev(div3, "class", "font-setting accent-color svelte-kehiie");
    			add_location(div3, file$4, 119, 0, 2520);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, span);
    			append_dev(span, t1);
    			append_dev(div0, t2);
    			append_dev(div0, input0);
    			set_input_value(input0, /*$app*/ ctx[0].currentFontFamily);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(label1, t4);
    			append_dev(label1, output);
    			append_dev(output, t5);
    			append_dev(label1, t6);
    			append_dev(div1, t7);
    			append_dev(div1, input1);
    			set_input_value(input1, /*$app*/ ctx[0].currentFontSize);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label2);
    			append_dev(label2, t9);
    			append_dev(label2, mark);
    			append_dev(mark, t10);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			if_block.m(div2, null);
    			append_dev(div2, t12);
    			append_dev(div2, button);
    			append_dev(button, t13);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*debouncedApply*/ ctx[1], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "change", /*debouncedApply*/ ctx[1], false, false, false),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[4]),
    					listen_dev(button, "click", /*resetAccent*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$app*/ 1 && t1_value !== (t1_value = /*$app*/ ctx[0].currentFontFamily + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$app*/ 1) {
    				set_style(span, "font-family", "'" + /*$app*/ ctx[0].currentFontFamily + "'");
    			}

    			if (dirty & /*$app*/ 1 && input0.value !== /*$app*/ ctx[0].currentFontFamily) {
    				set_input_value(input0, /*$app*/ ctx[0].currentFontFamily);
    			}

    			if (dirty & /*$app*/ 1 && t5_value !== (t5_value = /*$app*/ ctx[0].currentFontSize + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*$app*/ 1) {
    				set_input_value(input1, /*$app*/ ctx[0].currentFontSize);
    			}

    			if (dirty & /*$app*/ 1 && t10_value !== (t10_value = (/*$app*/ ctx[0].currentAccentColor || "Default") + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*$app*/ 1) {
    				set_style(mark, "background-color", /*$app*/ ctx[0].currentAccentColor || /*$app*/ ctx[0].currentTheme?.accent);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div2, t12);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div3);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FontSettings", slots, []);

    	function applyTheme() {
    		styleBuilder.applyTheme({
    			currentTheme: $app.currentTheme,
    			currentFontFamily: $app.currentFontFamily,
    			currentFontSize: $app.currentFontSize,
    			accentColor: $app.currentAccentColor
    		});
    	}

    	const debouncedApply = debounce(applyTheme, 300);

    	function resetAccent() {
    		$app.resetAccent();
    		applyTheme();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FontSettings> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$app.currentFontFamily = this.value;
    		app$1.set($app);
    	}

    	function input1_change_input_handler() {
    		$app.currentFontSize = to_number(this.value);
    		app$1.set($app);
    	}

    	function input_input_handler() {
    		$app.currentAccentColor = this.value;
    		app$1.set($app);
    	}

    	function input_input_handler_1() {
    		$app.currentAccentColor = this.value;
    		app$1.set($app);
    	}

    	$$self.$capture_state = () => ({
    		app: app$1,
    		styleBuilder,
    		debounce,
    		applyTheme,
    		debouncedApply,
    		resetAccent,
    		$app
    	});

    	return [
    		$app,
    		debouncedApply,
    		resetAccent,
    		input0_input_handler,
    		input1_change_input_handler,
    		input_input_handler,
    		input_input_handler_1
    	];
    }

    class FontSettings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-kehiie-style")) add_css$4();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FontSettings",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/ThemeSwitcher.svelte generated by Svelte v3.38.2 */
    const file$3 = "src/components/ThemeSwitcher.svelte";

    function add_css$3() {
    	var style = element("style");
    	style.id = "svelte-ymz8x5-style";
    	style.textContent = ".loading.svelte-ymz8x5.svelte-ymz8x5{position:relative;top:50%;transform:translateY(-50%);text-align:center;width:100%;margin:0 auto;padding:0 2rem;max-width:40rem;min-width:24rem}@media(min-width: 480px){.loading.svelte-ymz8x5 .title.svelte-ymz8x5{padding:0.625rem 0}.loading.svelte-ymz8x5 h1.svelte-ymz8x5{font-size:6em}}.loading.svelte-ymz8x5 h1.svelte-ymz8x5,.loading.svelte-ymz8x5 h4.svelte-ymz8x5{font-weight:normal;font-style:normal;color:var(--fg);text-rendering:optimizeLegibility;margin-top:0.2rem;margin-bottom:0.5rem;line-height:1.4}.loading.svelte-ymz8x5 small.svelte-ymz8x5{font-size:60%;color:var(--text);line-height:0;font-weight:300;letter-spacing:0.05em}.loading.svelte-ymz8x5 h1.svelte-ymz8x5{font-size:4em;font-weight:lighter;line-height:1;margin-top:0.25em;margin-bottom:0.25em;letter-spacing:0.025em;animation:fadeInDownShort 0.5s cubic-bezier(0.55, 0, 0.1, 1) both 0.5s;pointer-events:none}.loading.svelte-ymz8x5 h4.svelte-ymz8x5{margin-top:0;margin-bottom:0;line-height:1;font-size:2em}.loading.svelte-ymz8x5 h1.svelte-ymz8x5{margin:0}grid.svelte-ymz8x5.svelte-ymz8x5{display:grid;grid-template-columns:50% 50%;grid-column-gap:20px}.first-col.svelte-ymz8x5.svelte-ymz8x5,.second-col.svelte-ymz8x5.svelte-ymz8x5{text-align:left}.preview.svelte-ymz8x5.svelte-ymz8x5{background:var(--contrast);border:var(--hl) 1px solid;border-radius:20px;max-height:300px;overflow:auto}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGhlbWVTd2l0Y2hlci5zdmVsdGUiLCJzb3VyY2VzIjpbIlRoZW1lU3dpdGNoZXIuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCBQYWxldHRlIGZyb20gJy4vUGFsZXR0ZS5zdmVsdGUnO1xuICBpbXBvcnQgVGhlbWVTZWxlY3RvciBmcm9tICcuL1RoZW1lU2VsZWN0b3Iuc3ZlbHRlJztcbiAgaW1wb3J0IFRoZW1lUHJldmlldyBmcm9tICcuL1RoZW1lUHJldmlldy5zdmVsdGUnO1xuICBpbXBvcnQgRm9udFNldHRpbmdzIGZyb20gJy4vRm9udFNldHRpbmdzLnN2ZWx0ZSc7XG4gIGltcG9ydCB7YXBwfSBmcm9tICcuLi8kYXBwJztcbiAgaW1wb3J0IHtmYWRlLCBzbGlkZX0gZnJvbSAnc3ZlbHRlL3RyYW5zaXRpb24nO1xuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJsb2FkaW5nXCI+XG4gICAgeyNpZiAkYXBwLmN1cnJlbnRUaGVtZX1cbiAgICAgICAgPGhlYWRlciB0cmFuc2l0aW9uOmZhZGUgY2xhc3M9XCJ0aXRsZVwiPlxuICAgICAgICAgICAgPGg0Pk1hdGVyaWFsIFRoZW1lIFVJIGZvciBEZXZUb29sczwvaDQ+XG4gICAgICAgICAgICA8IS0tIFRoZSBzZWxlY3RlZCB0aGVtZSAtLT5cbiAgICAgICAgICAgIDxoMSBpZD1cImN1cnJlbnRUaGVtZVwiPlxuICAgICAgICAgICAgICAgIDxzbWFsbD57JGFwcC5jdXJyZW50VGhlbWUubmFtZX08L3NtYWxsPlxuICAgICAgICAgICAgPC9oMT5cblxuICAgICAgICAgICAgPCEtLSBEaXNwbGF5IHRoZSB0aGVtZSBjb2xvcnMgLS0+XG4gICAgICAgICAgICA8ZGl2IHRyYW5zaXRpb246c2xpZGU+XG4gICAgICAgICAgICAgICAgPFBhbGV0dGU+PC9QYWxldHRlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvaGVhZGVyPlxuICAgIHs6ZWxzZX1cbiAgICAgICAgPGhlYWRlcj5cbiAgICAgICAgICAgIDxoND5QbGVhc2Ugc2VsZWN0IGEgdGhlbWUgYmVsb3c8L2g0PlxuICAgICAgICAgICAgPGJyPjxicj5cbiAgICAgICAgPC9oZWFkZXI+XG4gICAgey9pZn1cblxuICAgIDxncmlkPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmlyc3QtY29sXCI+XG4gICAgICAgICAgICA8VGhlbWVTZWxlY3Rvcj48L1RoZW1lU2VsZWN0b3I+XG5cbiAgICAgICAgICAgIDxGb250U2V0dGluZ3M+PC9Gb250U2V0dGluZ3M+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3M9XCJzZWNvbmQtY29sIHByZXZpZXdcIj5cbiAgICAgICAgICAgIDxUaGVtZVByZXZpZXc+PC9UaGVtZVByZXZpZXc+XG4gICAgICAgIDwvZGl2PlxuICAgIDwvZ3JpZD5cbjwvZGl2PlxuXG48c3R5bGU+XG5cbiAgLmxvYWRpbmcge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB0b3A6IDUwJTtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSk7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIG1hcmdpbjogMCBhdXRvO1xuICAgIHBhZGRpbmc6IDAgMnJlbTtcbiAgICBtYXgtd2lkdGg6IDQwcmVtO1xuICAgIG1pbi13aWR0aDogMjRyZW07XG4gIH1cblxuICBAbWVkaWEgKG1pbi13aWR0aDogNDgwcHgpIHtcbiAgICAubG9hZGluZyAudGl0bGUge1xuICAgICAgcGFkZGluZzogMC42MjVyZW0gMDtcbiAgICB9XG5cbiAgICAubG9hZGluZyBoMSB7XG4gICAgICBmb250LXNpemU6IDZlbTtcbiAgICB9XG4gIH1cblxuICAubG9hZGluZyBoMSxcbiAgLmxvYWRpbmcgaDQge1xuICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgZm9udC1zdHlsZTogbm9ybWFsO1xuICAgIGNvbG9yOiB2YXIoLS1mZyk7XG4gICAgdGV4dC1yZW5kZXJpbmc6IG9wdGltaXplTGVnaWJpbGl0eTtcbiAgICBtYXJnaW4tdG9wOiAwLjJyZW07XG4gICAgbWFyZ2luLWJvdHRvbTogMC41cmVtO1xuICAgIGxpbmUtaGVpZ2h0OiAxLjQ7XG4gIH1cblxuICAubG9hZGluZyBzbWFsbCB7XG4gICAgZm9udC1zaXplOiA2MCU7XG4gICAgY29sb3I6IHZhcigtLXRleHQpO1xuICAgIGxpbmUtaGVpZ2h0OiAwO1xuICAgIGZvbnQtd2VpZ2h0OiAzMDA7XG4gICAgbGV0dGVyLXNwYWNpbmc6IDAuMDVlbTtcbiAgfVxuXG4gIC5sb2FkaW5nIGgxIHtcbiAgICBmb250LXNpemU6IDRlbTtcbiAgICBmb250LXdlaWdodDogbGlnaHRlcjtcbiAgICBsaW5lLWhlaWdodDogMTtcbiAgICBtYXJnaW4tdG9wOiAwLjI1ZW07XG4gICAgbWFyZ2luLWJvdHRvbTogMC4yNWVtO1xuICAgIGxldHRlci1zcGFjaW5nOiAwLjAyNWVtO1xuICAgIGFuaW1hdGlvbjogZmFkZUluRG93blNob3J0IDAuNXMgY3ViaWMtYmV6aWVyKDAuNTUsIDAsIDAuMSwgMSkgYm90aCAwLjVzO1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICB9XG5cbiAgLmxvYWRpbmcgaDQge1xuICAgIG1hcmdpbi10b3A6IDA7XG4gICAgbWFyZ2luLWJvdHRvbTogMDtcbiAgICBsaW5lLWhlaWdodDogMTtcbiAgICBmb250LXNpemU6IDJlbTtcbiAgfVxuXG4gIC5sb2FkaW5nIGgxIHtcbiAgICBtYXJnaW46IDA7XG4gIH1cblxuICBncmlkIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogNTAlIDUwJTtcbiAgICBncmlkLWNvbHVtbi1nYXA6IDIwcHg7XG4gIH1cblxuICAuZmlyc3QtY29sLFxuICAuc2Vjb25kLWNvbCB7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgfVxuXG4gIC5wcmV2aWV3IHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1jb250cmFzdCk7XG4gICAgYm9yZGVyOiB2YXIoLS1obCkgMXB4IHNvbGlkO1xuICAgIGJvcmRlci1yYWRpdXM6IDIwcHg7XG4gICAgbWF4LWhlaWdodDogMzAwcHg7XG4gICAgb3ZlcmZsb3c6IGF1dG87XG4gIH1cbjwvc3R5bGU+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTZDRSxRQUFRLDRCQUFDLENBQUMsQUFDUixRQUFRLENBQUUsUUFBUSxDQUNsQixHQUFHLENBQUUsR0FBRyxDQUNSLFNBQVMsQ0FBRSxXQUFXLElBQUksQ0FBQyxDQUMzQixVQUFVLENBQUUsTUFBTSxDQUNsQixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUNkLE9BQU8sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUNmLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFNBQVMsQ0FBRSxLQUFLLEFBQ2xCLENBQUMsQUFFRCxNQUFNLEFBQUMsWUFBWSxLQUFLLENBQUMsQUFBQyxDQUFDLEFBQ3pCLHNCQUFRLENBQUMsTUFBTSxjQUFDLENBQUMsQUFDZixPQUFPLENBQUUsUUFBUSxDQUFDLENBQUMsQUFDckIsQ0FBQyxBQUVELHNCQUFRLENBQUMsRUFBRSxjQUFDLENBQUMsQUFDWCxTQUFTLENBQUUsR0FBRyxBQUNoQixDQUFDLEFBQ0gsQ0FBQyxBQUVELHNCQUFRLENBQUMsZ0JBQUUsQ0FDWCxzQkFBUSxDQUFDLEVBQUUsY0FBQyxDQUFDLEFBQ1gsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsS0FBSyxDQUFFLElBQUksSUFBSSxDQUFDLENBQ2hCLGNBQWMsQ0FBRSxrQkFBa0IsQ0FDbEMsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsYUFBYSxDQUFFLE1BQU0sQ0FDckIsV0FBVyxDQUFFLEdBQUcsQUFDbEIsQ0FBQyxBQUVELHNCQUFRLENBQUMsS0FBSyxjQUFDLENBQUMsQUFDZCxTQUFTLENBQUUsR0FBRyxDQUNkLEtBQUssQ0FBRSxJQUFJLE1BQU0sQ0FBQyxDQUNsQixXQUFXLENBQUUsQ0FBQyxDQUNkLFdBQVcsQ0FBRSxHQUFHLENBQ2hCLGNBQWMsQ0FBRSxNQUFNLEFBQ3hCLENBQUMsQUFFRCxzQkFBUSxDQUFDLEVBQUUsY0FBQyxDQUFDLEFBQ1gsU0FBUyxDQUFFLEdBQUcsQ0FDZCxXQUFXLENBQUUsT0FBTyxDQUNwQixXQUFXLENBQUUsQ0FBQyxDQUNkLFVBQVUsQ0FBRSxNQUFNLENBQ2xCLGFBQWEsQ0FBRSxNQUFNLENBQ3JCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLFNBQVMsQ0FBRSxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDdkUsY0FBYyxDQUFFLElBQUksQUFDdEIsQ0FBQyxBQUVELHNCQUFRLENBQUMsRUFBRSxjQUFDLENBQUMsQUFDWCxVQUFVLENBQUUsQ0FBQyxDQUNiLGFBQWEsQ0FBRSxDQUFDLENBQ2hCLFdBQVcsQ0FBRSxDQUFDLENBQ2QsU0FBUyxDQUFFLEdBQUcsQUFDaEIsQ0FBQyxBQUVELHNCQUFRLENBQUMsRUFBRSxjQUFDLENBQUMsQUFDWCxNQUFNLENBQUUsQ0FBQyxBQUNYLENBQUMsQUFFRCxJQUFJLDRCQUFDLENBQUMsQUFDSixPQUFPLENBQUUsSUFBSSxDQUNiLHFCQUFxQixDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQzlCLGVBQWUsQ0FBRSxJQUFJLEFBQ3ZCLENBQUMsQUFFRCxzQ0FBVSxDQUNWLFdBQVcsNEJBQUMsQ0FBQyxBQUNYLFVBQVUsQ0FBRSxJQUFJLEFBQ2xCLENBQUMsQUFFRCxRQUFRLDRCQUFDLENBQUMsQUFDUixVQUFVLENBQUUsSUFBSSxVQUFVLENBQUMsQ0FDM0IsTUFBTSxDQUFFLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FDM0IsYUFBYSxDQUFFLElBQUksQ0FDbkIsVUFBVSxDQUFFLEtBQUssQ0FDakIsUUFBUSxDQUFFLElBQUksQUFDaEIsQ0FBQyJ9 */";
    	append_dev(document.head, style);
    }

    // (24:4) {:else}
    function create_else_block(ctx) {
    	let header;
    	let h4;
    	let t0;
    	let t1;
    	let br0;
    	let br1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h4 = element("h4");
    			t0 = text("Please select a theme below");
    			t1 = space();
    			br0 = element("br");
    			br1 = element("br");
    			this.h();
    		},
    		l: function claim(nodes) {
    			header = claim_element(nodes, "HEADER", {});
    			var header_nodes = children(header);
    			h4 = claim_element(header_nodes, "H4", { class: true });
    			var h4_nodes = children(h4);
    			t0 = claim_text(h4_nodes, "Please select a theme below");
    			h4_nodes.forEach(detach_dev);
    			t1 = claim_space(header_nodes);
    			br0 = claim_element(header_nodes, "BR", {});
    			br1 = claim_element(header_nodes, "BR", {});
    			header_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h4, "class", "svelte-ymz8x5");
    			add_location(h4, file$3, 25, 12, 794);
    			add_location(br0, file$3, 26, 12, 843);
    			add_location(br1, file$3, 26, 16, 847);
    			add_location(header, file$3, 24, 8, 773);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h4);
    			append_dev(h4, t0);
    			append_dev(header, t1);
    			append_dev(header, br0);
    			append_dev(header, br1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(24:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (11:4) {#if $app.currentTheme}
    function create_if_block$3(ctx) {
    	let header;
    	let h4;
    	let t0;
    	let t1;
    	let h1;
    	let small;
    	let t2_value = /*$app*/ ctx[0].currentTheme.name + "";
    	let t2;
    	let t3;
    	let div;
    	let palette;
    	let div_transition;
    	let header_transition;
    	let current;
    	palette = new Palette({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			h4 = element("h4");
    			t0 = text("Material Theme UI for DevTools");
    			t1 = space();
    			h1 = element("h1");
    			small = element("small");
    			t2 = text(t2_value);
    			t3 = space();
    			div = element("div");
    			create_component(palette.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			header = claim_element(nodes, "HEADER", { class: true });
    			var header_nodes = children(header);
    			h4 = claim_element(header_nodes, "H4", { class: true });
    			var h4_nodes = children(h4);
    			t0 = claim_text(h4_nodes, "Material Theme UI for DevTools");
    			h4_nodes.forEach(detach_dev);
    			t1 = claim_space(header_nodes);
    			h1 = claim_element(header_nodes, "H1", { id: true, class: true });
    			var h1_nodes = children(h1);
    			small = claim_element(h1_nodes, "SMALL", { class: true });
    			var small_nodes = children(small);
    			t2 = claim_text(small_nodes, t2_value);
    			small_nodes.forEach(detach_dev);
    			h1_nodes.forEach(detach_dev);
    			t3 = claim_space(header_nodes);
    			div = claim_element(header_nodes, "DIV", {});
    			var div_nodes = children(div);
    			claim_component(palette.$$.fragment, div_nodes);
    			div_nodes.forEach(detach_dev);
    			header_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h4, "class", "svelte-ymz8x5");
    			add_location(h4, file$3, 12, 12, 409);
    			attr_dev(small, "class", "svelte-ymz8x5");
    			add_location(small, file$3, 15, 16, 540);
    			attr_dev(h1, "id", "currentTheme");
    			attr_dev(h1, "class", "svelte-ymz8x5");
    			add_location(h1, file$3, 14, 12, 501);
    			add_location(div, file$3, 19, 12, 657);
    			attr_dev(header, "class", "title svelte-ymz8x5");
    			add_location(header, file$3, 11, 8, 358);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h4);
    			append_dev(h4, t0);
    			append_dev(header, t1);
    			append_dev(header, h1);
    			append_dev(h1, small);
    			append_dev(small, t2);
    			append_dev(header, t3);
    			append_dev(header, div);
    			mount_component(palette, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$app*/ 1) && t2_value !== (t2_value = /*$app*/ ctx[0].currentTheme.name + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(palette.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!header_transition) header_transition = create_bidirectional_transition(header, fade, {}, true);
    				header_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(palette.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			if (!header_transition) header_transition = create_bidirectional_transition(header, fade, {}, false);
    			header_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(palette);
    			if (detaching && div_transition) div_transition.end();
    			if (detaching && header_transition) header_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(11:4) {#if $app.currentTheme}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let grid;
    	let div0;
    	let themeselector;
    	let t1;
    	let fontsettings;
    	let t2;
    	let div1;
    	let themepreview;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$app*/ ctx[0].currentTheme) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	themeselector = new ThemeSelector({ $$inline: true });
    	fontsettings = new FontSettings({ $$inline: true });
    	themepreview = new ThemePreview({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			if_block.c();
    			t0 = space();
    			grid = element("grid");
    			div0 = element("div");
    			create_component(themeselector.$$.fragment);
    			t1 = space();
    			create_component(fontsettings.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(themepreview.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			div2 = claim_element(nodes, "DIV", { class: true });
    			var div2_nodes = children(div2);
    			if_block.l(div2_nodes);
    			t0 = claim_space(div2_nodes);
    			grid = claim_element(div2_nodes, "GRID", { class: true });
    			var grid_nodes = children(grid);
    			div0 = claim_element(grid_nodes, "DIV", { class: true });
    			var div0_nodes = children(div0);
    			claim_component(themeselector.$$.fragment, div0_nodes);
    			t1 = claim_space(div0_nodes);
    			claim_component(fontsettings.$$.fragment, div0_nodes);
    			div0_nodes.forEach(detach_dev);
    			t2 = claim_space(grid_nodes);
    			div1 = claim_element(grid_nodes, "DIV", { class: true });
    			var div1_nodes = children(div1);
    			claim_component(themepreview.$$.fragment, div1_nodes);
    			div1_nodes.forEach(detach_dev);
    			grid_nodes.forEach(detach_dev);
    			div2_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div0, "class", "first-col svelte-ymz8x5");
    			add_location(div0, file$3, 31, 8, 900);
    			attr_dev(div1, "class", "second-col preview svelte-ymz8x5");
    			add_location(div1, file$3, 37, 8, 1035);
    			attr_dev(grid, "class", "svelte-ymz8x5");
    			add_location(grid, file$3, 30, 4, 885);
    			attr_dev(div2, "class", "loading svelte-ymz8x5");
    			add_location(div2, file$3, 9, 0, 300);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			if_blocks[current_block_type_index].m(div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, grid);
    			append_dev(grid, div0);
    			mount_component(themeselector, div0, null);
    			append_dev(div0, t1);
    			mount_component(fontsettings, div0, null);
    			append_dev(grid, t2);
    			append_dev(grid, div1);
    			mount_component(themepreview, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div2, t0);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(themeselector.$$.fragment, local);
    			transition_in(fontsettings.$$.fragment, local);
    			transition_in(themepreview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(themeselector.$$.fragment, local);
    			transition_out(fontsettings.$$.fragment, local);
    			transition_out(themepreview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
    			destroy_component(themeselector);
    			destroy_component(fontsettings);
    			destroy_component(themepreview);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ThemeSwitcher", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ThemeSwitcher> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Palette,
    		ThemeSelector,
    		ThemePreview,
    		FontSettings,
    		app: app$1,
    		fade,
    		slide,
    		$app
    	});

    	return [$app];
    }

    class ThemeSwitcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-ymz8x5-style")) add_css$3();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThemeSwitcher",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Panel.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/components/Panel.svelte";

    function add_css$2() {
    	var style = element("style");
    	style.id = "svelte-1uauaek-style";
    	style.textContent = ".alert.svelte-1uauaek{position:absolute;z-index:3;width:100%;min-width:24rem;height:2.5rem;padding:0.625rem 0;background-color:var(--accent);color:var(--selFg);text-align:center;font-size:0.875rem;transition:all 0.25s ease;animation:fadeInDown 0.75s cubic-bezier(.55, 0, .1, 1) both 1s}.container.svelte-1uauaek{padding-top:2.5rem;display:grid;grid-template-columns:100%;grid-template-rows:[content] 100% [footer] 32px;grid-template-areas:\"content\"\n        \"footer\"}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFuZWwuc3ZlbHRlIiwic291cmNlcyI6WyJQYW5lbC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IEZvb3RlciBmcm9tICcuL0Zvb3Rlci5zdmVsdGUnO1xuICBpbXBvcnQge2FwcH0gZnJvbSAnLi4vJGFwcCc7XG4gIGltcG9ydCB7Ymx1cn0gZnJvbSAnc3ZlbHRlL3RyYW5zaXRpb24nO1xuICBpbXBvcnQgVGhlbWVTd2l0Y2hlciBmcm9tICcuL1RoZW1lU3dpdGNoZXIuc3ZlbHRlJztcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIC5hbGVydCB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHotaW5kZXg6IDM7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgbWluLXdpZHRoOiAyNHJlbTtcbiAgICBoZWlnaHQ6IDIuNXJlbTtcbiAgICBwYWRkaW5nOiAwLjYyNXJlbSAwO1xuICAgIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWFjY2VudCk7XG4gICAgY29sb3I6IHZhcigtLXNlbEZnKTtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgZm9udC1zaXplOiAwLjg3NXJlbTtcbiAgICB0cmFuc2l0aW9uOiBhbGwgMC4yNXMgZWFzZTtcbiAgICBhbmltYXRpb246IGZhZGVJbkRvd24gMC43NXMgY3ViaWMtYmV6aWVyKC41NSwgMCwgLjEsIDEpIGJvdGggMXM7XG4gIH1cblxuICAuY29udGFpbmVyIHtcbiAgICBwYWRkaW5nLXRvcDogMi41cmVtO1xuICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxMDAlO1xuICAgIGdyaWQtdGVtcGxhdGUtcm93czogW2NvbnRlbnRdIDEwMCUgW2Zvb3Rlcl0gMzJweDtcbiAgICBncmlkLXRlbXBsYXRlLWFyZWFzOlxuICAgICAgICBcImNvbnRlbnRcIlxuICAgICAgICBcImZvb3RlclwiO1xuICB9XG48L3N0eWxlPlxuXG57I2lmICRhcHAubm90aWZ5aW5nID09IHRydWV9XG4gICAgPGRpdiBjbGFzcz1cImFsZXJ0XCIgdHJhbnNpdGlvbjpibHVyPVwie3thbW91bnQ6IDEwfX1cIj5DbG9zZSBhbmQgcmVvcGVuIERldlRvb2xzIHRvIGFwcGx5IHlvdXIgY2hhbmdlcyE8L2Rpdj5cbnsvaWZ9XG5cbjxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICA8VGhlbWVTd2l0Y2hlcj48L1RoZW1lU3dpdGNoZXI+XG5cbiAgICA8Rm9vdGVyPjwvRm9vdGVyPlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFFLE1BQU0sZUFBQyxDQUFDLEFBQ04sUUFBUSxDQUFFLFFBQVEsQ0FDbEIsT0FBTyxDQUFFLENBQUMsQ0FDVixLQUFLLENBQUUsSUFBSSxDQUNYLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLE1BQU0sQ0FBRSxNQUFNLENBQ2QsT0FBTyxDQUFFLFFBQVEsQ0FBQyxDQUFDLENBQ25CLGdCQUFnQixDQUFFLElBQUksUUFBUSxDQUFDLENBQy9CLEtBQUssQ0FBRSxJQUFJLE9BQU8sQ0FBQyxDQUNuQixVQUFVLENBQUUsTUFBTSxDQUNsQixTQUFTLENBQUUsUUFBUSxDQUNuQixVQUFVLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQzFCLFNBQVMsQ0FBRSxVQUFVLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQUFDakUsQ0FBQyxBQUVELFVBQVUsZUFBQyxDQUFDLEFBQ1YsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsT0FBTyxDQUFFLElBQUksQ0FDYixxQkFBcUIsQ0FBRSxJQUFJLENBQzNCLGtCQUFrQixDQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUNoRCxtQkFBbUIsQ0FDZixTQUFTO1FBQ1QsUUFBUSxBQUNkLENBQUMifQ== */";
    	append_dev(document.head, style);
    }

    // (35:0) {#if $app.notifying == true}
    function create_if_block$2(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("Close and reopen DevTools to apply your changes!");
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			t = claim_text(div_nodes, "Close and reopen DevTools to apply your changes!");
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "alert svelte-1uauaek");
    			add_location(div, file$2, 35, 4, 801);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, blur, { amount: 10 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, blur, { amount: 10 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(35:0) {#if $app.notifying == true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t0;
    	let div;
    	let themeswitcher;
    	let t1;
    	let footer;
    	let current;
    	let if_block = /*$app*/ ctx[0].notifying == true && create_if_block$2(ctx);
    	themeswitcher = new ThemeSwitcher({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			create_component(themeswitcher.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    			this.h();
    		},
    		l: function claim(nodes) {
    			if (if_block) if_block.l(nodes);
    			t0 = claim_space(nodes);
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			claim_component(themeswitcher.$$.fragment, div_nodes);
    			t1 = claim_space(div_nodes);
    			claim_component(footer.$$.fragment, div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "container svelte-1uauaek");
    			add_location(div, file$2, 38, 0, 915);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(themeswitcher, div, null);
    			append_dev(div, t1);
    			mount_component(footer, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$app*/ ctx[0].notifying == true) {
    				if (if_block) {
    					if (dirty & /*$app*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(themeswitcher.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(themeswitcher.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(themeswitcher);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Panel", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Footer, app: app$1, blur, ThemeSwitcher, $app });
    	return [$app];
    }

    class Panel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1uauaek-style")) add_css$2();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Loading.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/components/Loading.svelte";

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-e526vu-style";
    	style.textContent = ".loading.svelte-e526vu.svelte-e526vu{background:var(--bg, #263238);display:flex;justify-content:center;align-items:flex-start;text-align:center;width:100%;margin:0 auto;padding:0 2rem;max-width:40rem;min-width:24rem}.loading.svelte-e526vu h4.svelte-e526vu{font-weight:normal;font-style:normal;color:var(--fg, #b0bec5);text-rendering:optimizeLegibility;margin-top:0.2rem;margin-bottom:0.5rem;line-height:1.4}.loading.svelte-e526vu h4.svelte-e526vu{margin-top:0;margin-bottom:0;line-height:1;font-size:2em}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9hZGluZy5zdmVsdGUiLCJzb3VyY2VzIjpbIkxvYWRpbmcuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzdHlsZT5cbiAgLmxvYWRpbmcge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWJnLCAjMjYzMjM4KTtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBwYWRkaW5nOiAwIDJyZW07XG4gICAgbWF4LXdpZHRoOiA0MHJlbTtcbiAgICBtaW4td2lkdGg6IDI0cmVtO1xuICB9XG5cbiAgLmxvYWRpbmcgaDQge1xuICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgZm9udC1zdHlsZTogbm9ybWFsO1xuICAgIGNvbG9yOiB2YXIoLS1mZywgI2IwYmVjNSk7XG4gICAgdGV4dC1yZW5kZXJpbmc6IG9wdGltaXplTGVnaWJpbGl0eTtcbiAgICBtYXJnaW4tdG9wOiAwLjJyZW07XG4gICAgbWFyZ2luLWJvdHRvbTogMC41cmVtO1xuICAgIGxpbmUtaGVpZ2h0OiAxLjQ7XG4gIH1cblxuICAubG9hZGluZyBoNCB7XG4gICAgbWFyZ2luLXRvcDogMDtcbiAgICBtYXJnaW4tYm90dG9tOiAwO1xuICAgIGxpbmUtaGVpZ2h0OiAxO1xuICAgIGZvbnQtc2l6ZTogMmVtO1xuICB9XG5cbjwvc3R5bGU+XG5cbjxzY3JpcHQ+XG4gIGltcG9ydCB7YXBwfSBmcm9tICcuLi8kYXBwJztcbjwvc2NyaXB0PlxuXG48ZGl2IGNsYXNzPVwibG9hZGluZ1wiPlxuICAgIHsjaWYgJGFwcC5sb2FkaW5nfVxuICAgICAgICA8aDQ+TG9hZGluZy4uLjwvaDQ+XG4gICAgey9pZn1cbjwvZGl2PiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDRSxRQUFRLDRCQUFDLENBQUMsQUFDUixVQUFVLENBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQzlCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsZUFBZSxDQUFFLE1BQU0sQ0FDdkIsV0FBVyxDQUFFLFVBQVUsQ0FDdkIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FDZCxPQUFPLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FDZixTQUFTLENBQUUsS0FBSyxDQUNoQixTQUFTLENBQUUsS0FBSyxBQUNsQixDQUFDLEFBRUQsc0JBQVEsQ0FBQyxFQUFFLGNBQUMsQ0FBQyxBQUNYLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFVBQVUsQ0FBRSxNQUFNLENBQ2xCLEtBQUssQ0FBRSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FDekIsY0FBYyxDQUFFLGtCQUFrQixDQUNsQyxVQUFVLENBQUUsTUFBTSxDQUNsQixhQUFhLENBQUUsTUFBTSxDQUNyQixXQUFXLENBQUUsR0FBRyxBQUNsQixDQUFDLEFBRUQsc0JBQVEsQ0FBQyxFQUFFLGNBQUMsQ0FBQyxBQUNYLFVBQVUsQ0FBRSxDQUFDLENBQ2IsYUFBYSxDQUFFLENBQUMsQ0FDaEIsV0FBVyxDQUFFLENBQUMsQ0FDZCxTQUFTLENBQUUsR0FBRyxBQUNoQixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    // (39:4) {#if $app.loading}
    function create_if_block$1(ctx) {
    	let h4;
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text("Loading...");
    			this.h();
    		},
    		l: function claim(nodes) {
    			h4 = claim_element(nodes, "H4", { class: true });
    			var h4_nodes = children(h4);
    			t = claim_text(h4_nodes, "Loading...");
    			h4_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(h4, "class", "svelte-e526vu");
    			add_location(h4, file$1, 39, 8, 695);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(39:4) {#if $app.loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let if_block = /*$app*/ ctx[0].loading && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true });
    			var div_nodes = children(div);
    			if (if_block) if_block.l(div_nodes);
    			div_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(div, "class", "loading svelte-e526vu");
    			add_location(div, file$1, 37, 0, 642);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$app*/ ctx[0].loading) {
    				if (if_block) ; else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Loading", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Loading> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ app: app$1, $app });
    	return [$app];
    }

    class Loading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-e526vu-style")) add_css$1();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-16go92p-style";
    	style.textContent = ".main.svelte-16go92p{width:100vw;height:100vh;position:relative;display:flex;flex-direction:column;justify-content:flex-start;align-items:center}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQge29uTW91bnR9IGZyb20gJ3N2ZWx0ZSc7XG4gIGltcG9ydCB5YW1sIGZyb20gJ2pzLXlhbWwnO1xuICBpbXBvcnQgKiBhcyBhcGkgZnJvbSAnLi9hcGknO1xuICBpbXBvcnQge2FwcH0gZnJvbSAnLi8kYXBwJztcbiAgaW1wb3J0IFBhbmVsIGZyb20gJy4vY29tcG9uZW50cy9QYW5lbC5zdmVsdGUnO1xuICBpbXBvcnQgTG9hZGluZyBmcm9tICcuL2NvbXBvbmVudHMvTG9hZGluZy5zdmVsdGUnO1xuXG4gIG9uTW91bnQoYXN5bmMgXyA9PiB7XG4gICAgJGFwcC5sb2FkaW5nID0gdHJ1ZTtcbiAgICAvLyBKdXN0IHdhaXRpbmdcbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMCkpO1xuICAgIC8vIE5vdyBmZXRjaGluZ1xuICAgIGNvbnN0IHRoZW1lc1ltbCA9IGF3YWl0IGFwaS5nZXQoJ3RoZW1lcy55bWwnKTtcbiAgICBjb25zdCBhbGxUaGVtZXMgPSB5YW1sLmxvYWQodGhlbWVzWW1sKTtcbiAgICBjb25zdCB0aGVtZXMgPSBbXG4gICAgICAuLi5hbGxUaGVtZXMubWF0ZXJpYWwsXG4gICAgICAuLi5hbGxUaGVtZXMub3RoZXIsXG4gICAgXTtcblxuICAgIC8vIExvYWQgdGhlbWVzXG4gICAgJGFwcC5sb2FkVGhlbWVzKHRoZW1lcyk7XG4gICAgLy8gR2V0IHNldHRpbmdzIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgIGF3YWl0ICRhcHAuZmV0Y2hTZXR0aW5ncygpO1xuICAgIC8vIEFkZCBkZWZhdWx0c1xuICAgICRhcHAubG9hZERlZmF1bHRzKCk7XG5cbiAgICAkYXBwLmxvYWRpbmcgPSBmYWxzZTtcbiAgfSk7XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAubWFpbiB7XG4gICAgd2lkdGg6IDEwMHZ3O1xuICAgIGhlaWdodDogMTAwdmg7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgfVxuPC9zdHlsZT5cblxuXG48bWFpbiBjbGFzcz1cIm1haW5cIj5cbiAgICA8TG9hZGluZz48L0xvYWRpbmc+XG4gICAgeyNpZiAhJGFwcC5sb2FkaW5nfVxuICAgICAgICA8UGFuZWw+PC9QYW5lbD5cbiAgICB7L2lmfVxuPC9tYWluPiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFnQ0UsS0FBSyxlQUFDLENBQUMsQUFDTCxLQUFLLENBQUUsS0FBSyxDQUNaLE1BQU0sQ0FBRSxLQUFLLENBQ2IsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsTUFBTSxDQUN0QixlQUFlLENBQUUsVUFBVSxDQUMzQixXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    // (47:4) {#if !$app.loading}
    function create_if_block(ctx) {
    	let panel;
    	let current;
    	panel = new Panel({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(panel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			claim_component(panel.$$.fragment, nodes);
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(47:4) {#if !$app.loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let loading;
    	let t;
    	let current;
    	loading = new Loading({ $$inline: true });
    	let if_block = !/*$app*/ ctx[0].loading && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(loading.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			this.h();
    		},
    		l: function claim(nodes) {
    			main = claim_element(nodes, "MAIN", { class: true });
    			var main_nodes = children(main);
    			claim_component(loading.$$.fragment, main_nodes);
    			t = claim_space(main_nodes);
    			if (if_block) if_block.l(main_nodes);
    			main_nodes.forEach(detach_dev);
    			this.h();
    		},
    		h: function hydrate() {
    			attr_dev(main, "class", "main svelte-16go92p");
    			add_location(main, file, 44, 0, 973);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(loading, main, null);
    			append_dev(main, t);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*$app*/ ctx[0].loading) {
    				if (if_block) {
    					if (dirty & /*$app*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(loading);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $app;
    	validate_store(app$1, "app");
    	component_subscribe($$self, app$1, $$value => $$invalidate(0, $app = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	onMount(async _ => {
    		set_store_value(app$1, $app.loading = true, $app);

    		// Just waiting
    		await new Promise(resolve => setTimeout(resolve, 1000));

    		// Now fetching
    		const themesYml = await get("themes.yml");

    		const allThemes = jsYaml.load(themesYml);
    		const themes = [...allThemes.material, ...allThemes.other];

    		// Load themes
    		$app.loadThemes(themes);

    		// Get settings from local storage
    		await $app.fetchSettings();

    		// Add defaults
    		$app.loadDefaults();

    		set_store_value(app$1, $app.loading = false, $app);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		yaml: jsYaml,
    		api,
    		app: app$1,
    		Panel,
    		Loading,
    		$app
    	});

    	return [$app];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-16go92p-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.querySelector('#app'),
      hydrate: true,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
