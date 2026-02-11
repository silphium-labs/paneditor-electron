/* global window Promise WebSocket Uint8Array Text */

import { highlightCode } from 'bedazzlr';
import { createSignal, useContext } from 'solid-js';

import { spam } from '@bablr/boot';

import './Editor.css';
import { StoreContext } from '../../state/solid';
import { getStreamIterator, StreamIterable, wait } from '@bablr/agast-helpers/stream';

let inRange = (v, min, max) => v > min && v < max;

let matcher = spam`<$__Expression />`;

function* __codePointsFor(bytes) {
  let iter = getStreamIterator(bytes);
  let step = iter.next();
  let partialValue = null;

  for (;;) {
    if (step instanceof Promise) {
      step = yield wait(step);
    }

    if (step.done) break;

    let { value } = step;

    if (partialValue) {
      if (inRange(value, 0xdc00, 0xdfff)) {
        yield (0x10000 + (partialValue & (0x3ff << 10)) + value) & 0x3ff;
      } else {
        yield 0xfffd;
      }

      partialValue = null;
    } else if (!inRange(value, 0xd800, 0xdfff)) {
      yield value;
    } else if (inRange(value, 0xdc00, 0xdfff)) {
      yield 0xfffd;
    } else if (inRange(value, 0xd800, 0xdbff)) {
      partialValue = value;
    }

    step = iter.next();
  }

  if (partialValue) {
    yield 0xfffd;
  }
}

let codePointsFor = (bytes) => {
  return new StreamIterable(__codePointsFor(bytes));
};

function* __decodeUTF8(bytes) {
  let codePoints = codePointsFor(bytes);
  let iter = getStreamIterator(codePoints);
  let step = iter.next();

  for (;;) {
    if (step instanceof Promise) {
      step = yield wait(step);
    }

    if (step.done) break;

    let cp = step.value;

    if (cp <= 0xffff) {
      yield String.fromCharCode(cp);
    } else {
      cp -= 0x10000;
      yield String.fromCharCode((cp >> 10) + 0xd800, (cp & 0x3ff) + 0xdc00);
    }

    step = iter.next();
  }
}

let decodeUTF8 = (bytes) => {
  return new StreamIterable(__decodeUTF8(bytes));
};

let CircularBuffer = {
  create(maxSize) {
    return {
      values: new Array(maxSize),
      size: 0,
      startIndex: 0,
    };
  },

  getValuesIdx(idx, buffer) {
    return (buffer.startIndex + idx) % buffer.values.length;
  },

  getAt(idx, buffer) {
    return buffer.values[CircularBuffer.getValuesIdx(idx, buffer)];
  },

  push(buffer, value) {
    let { size, values } = buffer;
    if (size === values.length) throw new Error();

    values[CircularBuffer.getValuesIdx(size, buffer)] = value;
    buffer.size++;
  },

  shift(buffer) {
    buffer.startIndex++;
    buffer.size--;
  },

  empty(buffer) {
    buffer.size = 0;
  },

  *traverse(buffer) {
    let { values, size, startIndex } = buffer;
    for (let i = 0; i < size; i++) {
      yield values[(startIndex + i) % values.length];
    }
  },
};

let makeDeferred = () => {
  let resolve, reject;
  let promise = new Promise((rslv, rjct) => {
    resolve = rslv;
    reject = rjct;
  });
  return { resolve, reject, promise };
};

let socketStream = (url) => {
  let socket = new WebSocket(url);
  socket.binaryType = 'arraybuffer';
  let done = Symbol();
  let buffer = CircularBuffer.create(24);
  let deferred = makeDeferred();
  let paused = false;

  socket.addEventListener('message', (event) => {
    if (buffer.size >= 16 && !paused) {
      socket.send(JSON.stringify({ type: 'pause', value: null }));
    }
    CircularBuffer.push(buffer, event.data);
    if (deferred) {
      deferred.resolve(event.data);
      deferred = null;
    }
  });

  socket.addEventListener('close', () => {
    CircularBuffer.push(buffer, done);
  });

  return new StreamIterable(
    (function* __stream() {
      yield wait(deferred.promise);

      if (buffer.size < 8 && paused) {
        socket.send(JSON.stringify({ type: 'resume', value: null }));
      }

      for (let value of CircularBuffer.traverse(buffer)) {
        if (value !== done) {
          yield* new Uint8Array(value);
        } else {
          return;
        }
        CircularBuffer.shift(buffer);

        if (!buffer.size) {
          deferred = makeDeferred();

          yield wait(deferred.promise);
        } else {
          // give the buffer a chance to fill up
          yield wait(Promise.resolve());
        }
      }
    })(),
  );
};

function Editor() {
  let { store } = useContext(StoreContext);

  let stream = () =>
    store.activeFile
      ? decodeUTF8(
          socketStream(
            `ws://localhost:8084/files?path=${encodeURIComponent(`${store.projectRoot}/${store.activeFile.join('/')}`)}`,
          ),
        )
      : null;

  let { 0: error, 1: setError } = createSignal();

  let buffer = () => {
    let buffer = <div class="buffer" />;
    buffer.innerHTML = '';

    if (!stream()) {
      return <></>;
    }

    let iter = getStreamIterator(stream());

    (async () => {
      let step = iter.next();

      let str = '';
      while (true) {
        if (step instanceof Promise) {
          buffer.appendChild(new Text(str));

          step = await step;
          str = '';
        }
        if (step.done) {
          buffer.appendChild(new Text(str));
          break;
        }

        let chr = step.value;

        str += chr;
        step = iter.next();
      }
    })().catch((e) => {
      setError(e);
    });

    return buffer;
  };

  return (
    <>
      <pre class="editor">
        {error()}
        {buffer()}
        {/* <div class="paste-bin">
          <div
            class="coin add-snippet"
            onClick={() => {
              changeFocus('snippets');
            }}
          >
            +
          </div>
          <div class="coin top-snippet">sn</div>
        </div> */}
      </pre>
    </>
  );
}

export default Editor;
