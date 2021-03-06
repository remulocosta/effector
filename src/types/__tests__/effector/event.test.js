// @flow
/* eslint-disable no-unused-vars */
import {
  createEvent,
  Event,
  /*::type*/ CompositeName,
  /*::type*/ kind,
} from 'effector'

const typecheck = '{global}'

test('createEvent', () => {
  const createEvent_event1: Event<number> = createEvent()
  const createEvent_event2: Event<number> = createEvent('event name [1]')
  const createEvent_event3: Event<number> = createEvent({
    name: 'event name [2]',
  })
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    no errors

    --flow--
    no errors
    "
  `)
})
test('#(properties)', () => {
  const event = createEvent()
  const kind1: kind = event.kind
  const shortName: string = event.shortName
  const compositeName: CompositeName = event.compositeName

  const computed = event.map(() => 'hello')
  const kind2: kind = computed.kind
  const shortName1: string = computed.shortName
  const compositeName1: CompositeName = computed.compositeName
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    no errors

    --flow--
    no errors
    "
  `)
})
test('#map', () => {
  const event: Event<number> = createEvent()
  const computed = event.map(() => 'foo')

  //const check1: Event<string> = computed
  const event_map_check2: Event<number> = computed
  event(2)
  computed('')
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    Type 'Event<string>' is not assignable to type 'Event<number>'.
      Types of property 'watch' are incompatible.
        Type '(watcher: (payload: string) => any) => Subscription' is not assignable to type '(watcher: (payload: number) => any) => Subscription'.
          Types of parameters 'watcher' and 'watcher' are incompatible.
            Types of parameters 'payload' and 'payload' are incompatible.
              Type 'string' is not assignable to type 'number'.

    --flow--
    Cannot assign 'computed' to 'event_map_check2'
      const event_map_check2: Event<number> = computed
                                              ^^^^^^^^
      string [1] is incompatible with number [2] in type argument 'Payload' [3]. [incompatible-type-arg]
          const computed = event.map(() => 'foo')
                                       [1] ^^^^^
          const event_map_check2: Event<number> = computed
                                    [2] ^^^^^^
          declare export class Event<Payload> implements Unit<Payload> {
                                 [3] ^^^^^^^
    Cannot assign 'computed' to 'event_map_check2'
      const event_map_check2: Event<number> = computed
                                              ^^^^^^^^
      string [1] is incompatible with number [2] in type argument 'Payload' [3]. [incompatible-type-arg]
          computed('')
               [1] ^^
          const event_map_check2: Event<number> = computed
                                    [2] ^^^^^^
          declare export class Event<Payload> implements Unit<Payload> {
                                 [3] ^^^^^^^
    "
  `)
})
test('#watch', () => {
  const event: Event<number> = createEvent()
  event.watch(state => {
    const check1: number = state
    return state
  })
  event.watch(state => 'foo')
  event.watch(state => {})
  event.watch(state => {})
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    no errors

    --flow--
    no errors
    "
  `)
})
describe('#filterMap', () => {
  test('#filterMap ok', () => {
    const event: Event<number> = createEvent()
    const filteredEvent_ok: Event<string> = event.filterMap(n => {
      if (n % 2) return n.toString()
    })
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      no errors

      --flow--
      no errors
      "
    `)
  })
  test('#filterMap incorrect', () => {
    const event: Event<number> = createEvent()
    const filteredEvent_error: Event<number> = event.filterMap(n => {
      if (n % 2) return n.toString()
    })
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      Type 'Event<string>' is not assignable to type 'Event<number>'.

      --flow--
      Cannot assign 'event.filterMap(...)' to 'filteredEvent_error'
        if (n % 2) return n.toString()
                          ^^^^^^^^^^^^
        string [1] is incompatible with number [2] in type argument 'Payload' [3]. [incompatible-type-arg]
        <BUILTINS>/core.js
            toString(radix?: number): string;
                                  [1] ^^^^^^
            const filteredEvent_error: Event<number> = event.filterMap(n => {
                                         [2] ^^^^^^
            declare export class Event<Payload> implements Unit<Payload> {
                                   [3] ^^^^^^^
      "
    `)
  })
})
describe('#prepend', () => {
  test('infer argument type', () => {
    const event = createEvent<string>()
    const prepended = event.prepend((arg: number) => 'foo')
    prepended(1)
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      no errors

      --flow--
      no errors
      "
    `)
  })
  test('infer void type', () => {
    const event = createEvent<string>()
    const prepended = event.prepend<void>(() => 'foo')
    prepended()
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      no errors

      --flow--
      no errors
      "
    `)
  })
  test('infer optional type', () => {
    const event = createEvent<string>()
    const prepended = event.prepend((arg?: number) => 'foo')
    prepended()
    prepended(1)
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      no errors

      --flow--
      no errors
      "
    `)
  })
  test('argument type mismatch', () => {
    const event = createEvent<string>()
    const prepended = event.prepend((arg: number) => 'foo')
    prepended('')
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      No overload matches this call.
        Overload 1 of 2, '(payload: number): number', gave the following error.
          Argument of type 'string' is not assignable to parameter of type 'number'.
        Overload 2 of 2, '(this: \\"Error: Expected 1 argument, but got 0\\", payload?: number | undefined): void', gave the following error.
          The 'this' context of type 'void' is not assignable to method's 'this' of type '\\"Error: Expected 1 argument, but got 0\\"'.

      --flow--
      Cannot call 'prepended' with empty string bound to 'payload'
        prepended('')
                  ^^
        string [1] is incompatible with number [2]. [incompatible-call]
            prepended('')
                  [1] ^^
            const prepended = event.prepend((arg: number) => 'foo')
                                              [2] ^^^^^^
      "
    `)
  })
  test('void type mismatch', () => {
    const event = createEvent<string>()
    const prepended = event.prepend(() => 'foo')
    prepended('')
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      No overload matches this call.
        Overload 1 of 2, '(payload: void): void', gave the following error.
          Argument of type 'string' is not assignable to parameter of type 'void'.
        Overload 2 of 2, '(this: void, payload?: void | undefined): void', gave the following error.
          Argument of type '\\"\\"' is not assignable to parameter of type 'void | undefined'.

      --flow--
      no errors
      "
    `)
  })
  test('target event type mismatch', () => {
    const event = createEvent<number>()
    const prepended = event.prepend((arg: boolean) => 'foo')
    prepended(true)
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      Argument of type '(arg: boolean) => string' is not assignable to parameter of type '(_: boolean) => number'.
        Type 'string' is not assignable to type 'number'.

      --flow--
      Cannot call 'event.prepend' with function bound to 'fn'
        const prepended = event.prepend((arg: boolean) => 'foo')
                                                          ^^^^^
        string [1] is incompatible with number [2] in the return value. [incompatible-call]
            const prepended = event.prepend((arg: boolean) => 'foo')
                                                          [1] ^^^^^
            const event = createEvent<number>()
                                  [2] ^^^^^^
      "
    `)
  })
  test('void target event edge case', () => {
    const event: Event<void> = createEvent()
    const prepended = event.prepend((arg: number) => 'foo') // returns string
    prepended(1)
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      no errors

      --flow--
      Cannot call 'event.prepend' with function bound to 'fn'
        const prepended = event.prepend((arg: number) => 'foo') // returns string
                                                         ^^^^^
        string [1] is incompatible with undefined [2] in the return value. [incompatible-call]
            const prepended = event.prepend((arg: number) => 'foo') // returns string
                                                         [1] ^^^^^
            const event: Event<void> = createEvent()
                           [2] ^^^^
      "
    `)
  })
})
test('void function interop (should pass)', () => {
  /*::
  type unknown = any;
  type never = any;
  */
  const voidFn: () => void = createEvent<void>()
  const voidFn1: () => void = createEvent</*:: typeof */ undefined>()
  const voidFn2: () => void = createEvent<any>()
  const voidFn3: () => void = createEvent<never>()
  const voidFn4: () => void = createEvent<unknown>()
  const event = createEvent()
  event()
  const event1 = createEvent</*:: typeof */ undefined>()
  event1()
  const event2 = createEvent<any>()
  event2()
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    no errors

    --flow--
    no errors
    "
  `)
})
test('call event without params', () => {
  const event = createEvent<number>()
  event()
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    The 'this' context of type 'void' is not assignable to method's 'this' of type '\\"Error: Expected 1 argument, but got 0\\"'.

    --flow--
    Cannot call 'event'
      event()
      ^^^^^
      function [1] requires another argument. [incompatible-call]
          (payload: Payload): Payload;
      [1] ^^^^^^^^^^^^^^^^^^^^^^^^^^^
    "
  `)
})
test('call event without params (unknown)', () => {
  /*:: type unknown = any; */
  // Expects 1 unknown argument
  const event = createEvent<unknown>()
  event()
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    The 'this' context of type 'void' is not assignable to method's 'this' of type '\\"Error: Expected 1 argument, but got 0\\"'.

    --flow--
    no errors
    "
  `)
})
test('call event without params (never)', () => {
  /*:: type never = any; */
  // Should never be called
  const event = createEvent<never>()
  event()
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    The 'this' context of type 'void' is not assignable to method's 'this' of type 'never'.

    --flow--
    no errors
    "
  `)
})
test('assign event to a function (should pass)', () => {
  const fn1: (event: number) => number = createEvent<number>()
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    no errors

    --flow--
    no errors
    "
  `)
})
test('assign event to a function (should fail)', () => {
  /*:: type unknown = any; */
  const fn1: (event: number) => unknown = createEvent<string>()
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    Type 'Event<string>' is not assignable to type '(event: number) => unknown'.
      Types of parameters 'payload' and 'event' are incompatible.
        Type 'number' is not assignable to type 'string'.

    --flow--
    Cannot assign 'createEvent<...>()' to 'fn1'
      const fn1: (event: number) => unknown = createEvent<string>()
                                              ^^^^^^^^^^^^^^^^^^^^^
      string [1] is incompatible with number [2] in the first argument. [incompatible-type]
          const fn1: (event: number) => unknown = createEvent<string>()
                                                          [1] ^^^^^^
          const fn1: (event: number) => unknown = createEvent<string>()
                         [2] ^^^^^^
    "
  `)
})
describe('event as function argument', () => {
  test('direct pass', () => {
    function fn(arg: (_: number) => number) {}
    const event = createEvent<string>()
    fn(event)
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      Argument of type 'Event<string>' is not assignable to parameter of type '(_: number) => number'.
        Types of parameters 'payload' and '_' are incompatible.
          Type 'number' is not assignable to type 'string'.

      --flow--
      Cannot call 'fn' with 'event' bound to 'arg'
        fn(event)
           ^^^^^
        string [1] is incompatible with number [2] in the first argument. [incompatible-call]
            const event = createEvent<string>()
                                  [1] ^^^^^^
            function fn(arg: (_: number) => number) {}
                             [2] ^^^^^^
      Cannot call 'fn' with 'event' bound to 'arg'
        fn(event)
           ^^^^^
        string [1] is incompatible with number [2] in the return value. [incompatible-call]
            const event = createEvent<string>()
                                  [1] ^^^^^^
            function fn(arg: (_: number) => number) {}
                                        [2] ^^^^^^
      "
    `)
  })
  test('indirect pass', () => {
    function fn(arg: (_: number) => number) {}
    const event = createEvent<string>()
    fn(e => event(e))
    expect(typecheck).toMatchInlineSnapshot(`
      "
      --typescript--
      No overload matches this call.
        Overload 1 of 2, '(payload: string): string', gave the following error.
          Argument of type 'number' is not assignable to parameter of type 'string'.
        Overload 2 of 2, '(this: \\"Error: Expected 1 argument, but got 0\\", payload?: string | undefined): void', gave the following error.
          The 'this' context of type 'void' is not assignable to method's 'this' of type '\\"Error: Expected 1 argument, but got 0\\"'.

      --flow--
      Cannot call 'fn' with function bound to 'arg'
        fn(e => event(e))
                ^^^^^^^^
        string [1] is incompatible with number [2] in the return value. [incompatible-call]
            const event = createEvent<string>()
                                  [1] ^^^^^^
            function fn(arg: (_: number) => number) {}
                                        [2] ^^^^^^
      Cannot call 'event' with 'e' bound to 'payload'
        fn(e => event(e))
                      ^
        number [1] is incompatible with string [2]. [incompatible-call]
            function fn(arg: (_: number) => number) {}
                             [1] ^^^^^^
            const event = createEvent<string>()
                                  [2] ^^^^^^
      "
    `)
  })
})
test('createEvent edge case', () => {
  // Default type is inferred
  const fn: (event: number) => number = createEvent()
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    no errors

    --flow--
    no errors
    "
  `)
})
test('void function edge case (should fail)', () => {
  /*:: type unknown = any; */
  // Typed event is assignable to a void function
  const voidFn: () => void = createEvent<number>()
  expect(typecheck).toMatchInlineSnapshot(`
    "
    --typescript--
    no errors

    --flow--
    Cannot assign 'createEvent<...>()' to 'voidFn'
      const voidFn: () => void = createEvent<number>()
                                 ^^^^^^^^^^^^^^^^^^^^^
      function type [1] requires another argument from function type [2]. [incompatible-type]
          (payload: Payload): Payload;
      [1] ^^^^^^^^^^^^^^^^^^^^^^^^^^^
          const voidFn: () => void = createEvent<number>()
                    [2] ^^^^^^^^^^
    Cannot assign 'createEvent<...>()' to 'voidFn'
      const voidFn: () => void = createEvent<number>()
                                 ^^^^^^^^^^^^^^^^^^^^^
      number [1] is incompatible with undefined [2] in the return value. [incompatible-type]
          const voidFn: () => void = createEvent<number>()
                                             [1] ^^^^^^
          const voidFn: () => void = createEvent<number>()
                          [2] ^^^^
    "
  `)
})
