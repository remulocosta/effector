//@flow

import type {
  Graph,
  StateRef,
  Cmd,
  Emit,
  Run,
  Update,
  Filter,
  Compute,
} from 'effector/stdlib'
import {__DEBUG__} from 'effector/flags'

export function exec(unit: {+graphite: Graph<any>, ...}, payload: any) {
  runtime(unit.graphite, payload)
}
export function runtime(graph: Graph<any>, payload: any) {
  const pendingEvents = []
  runStep(graph, payload, pendingEvents)
  runPendings(pendingEvents)
}
const runPendings = pendings => {
  if (pendings.length === 0) return
  const ordered = []
  const orderedIDs = []
  for (let i = pendings.length - 1; i >= 0; i--) {
    const item = pendings[i]
    if (orderedIDs.indexOf(item.event.id) !== -1) continue
    orderedIDs.push(item.event.id)
    ordered.push(item)
  }
  if (ordered.length === 0) return
  for (let i = ordered.length - 1; i >= 0; i--) {
    const item = ordered[i]
    item.event(item.data)
  }
  console.warn('orderedIDs', orderedIDs)
}
class Stack {
  /*::
  value: any
  parent: Stack | null
  */
  constructor(value: any, parent: Stack | null) {
    this.value = value
    this.parent = parent
  }
}
type Layer = {|
  +step: Graph<any>,
  +firstIndex: number,
  +scope: Stack,
  +resetStop: boolean,
  +type: 'layer' | 'merge' | 'effect',
  +id: number,
|}

export class Leftist {
  left: leftist
  right: leftist
  value: Layer
  rank: number
  constructor(value: Layer, rank: number, left: leftist, right: leftist) {
    this.value = value
    this.rank = rank
    this.left = left
    this.right = right
  }
}
export type leftist = null | Leftist
function insert(
  x: Layer,
  t: leftist,
  comparator: (Layer, Layer) => boolean,
): leftist {
  return merge(new Leftist(x, 1, null, null), t, comparator)
}
function deleteMin(
  param: leftist,
  comparator: (Layer, Layer) => boolean,
): leftist {
  if (param) {
    return merge(param.left, param.right, comparator)
  }
  return null
}
function merge(
  _t1: leftist,
  _t2: leftist,
  comparator: (Layer, Layer) => boolean,
): leftist {
  let t2
  let t1
  let k1
  let l
  let merged
  let rank_left
  let rank_right
  while (true) {
    t2 = _t2
    t1 = _t1
    if (t1) {
      if (t2) {
        k1 = t1.value
        l = t1.left
        if (comparator(k1, t2.value)) {
          _t2 = t1
          _t1 = t2
          continue
        }
        merged = merge(t1.right, t2, comparator)
        rank_left = l?.rank ?? 0
        rank_right = merged?.rank ?? 0
        if (rank_left >= rank_right) {
          return new Leftist(k1, rank_right + 1, l, merged)
        }
        return new Leftist(k1, rank_left + 1, merged, l)
      }
      return t1
    }
    return t2
  }
  /*::return _t1*/
}
class Local {
  /*::
  isChanged: boolean
  isFailed: boolean
  arg: any
  */
  constructor(arg: any) {
    this.isChanged = true
    this.isFailed = false
    this.arg = arg
  }
}
const layerComparator = (a: Layer, b: Layer) => {
  if (a.type === b.type) return a.id > b.id
  let arank = -1
  switch (a.type) {
    case 'layer':
      arank = 0
      break
    case 'merge':
      arank = 1
      break
    case 'effect':
      arank = 2
      break
  }
  let brank = -1
  switch (b.type) {
    case 'layer':
      brank = 0
      break
    case 'merge':
      brank = 1
      break
    case 'effect':
      brank = 2
      break
  }
  return arank > brank
}
function iterate(tree: leftist) {
  const results = []
  while (tree) {
    results.push(tree.value)
    tree = deleteMin(tree, layerComparator)
  }
  return results
}
const flattenLayer = (layer: Layer) => {
  const result = {}
  const scope = []
  let currentScope = layer.scope
  while (currentScope) {
    scope.push(currentScope.value)
    currentScope = currentScope.parent
  }
  result.id = layer.id
  result.type = layer.type
  result.scope = scope
  return result
}
const printLayers = list => {
  const flatten = list.map(flattenLayer)
  console.table((flatten: any))
  for (let i = 0; i < flatten.length; i++) {
    console.table((flatten[i].scope.reverse(): any))
  }
}
let layerID = 0
const runStep = (step: Graph<any>, payload: any, pendingEvents) => {
  const voidStack = new Stack(null, null)
  let heap = new Leftist(
    {
      step,
      firstIndex: 0,
      scope: new Stack(payload, voidStack),
      resetStop: false,
      type: 'layer',
      id: ++layerID,
    },
    1,
    null,
    null,
  )
  const addFifo = (opts: Layer) => {
    heap = insert(opts, heap, layerComparator)
  }

  // let last = fifo
  const runFifo = () => {
    while (heap) {
      runGraph(heap.value)
      heap = deleteMin(heap, layerComparator)
      if (__DEBUG__) {
        const list = iterate(heap)
        if (list.length > 4) {
          printLayers(list)
        }
      }
    }
  }
  const runGraph = (layer: Layer) => {
    const {step: graph, firstIndex, scope, resetStop} = layer
    meta.val = graph.val
    for (
      let stepn = firstIndex;
      stepn < graph.seq.length && !meta.stop;
      stepn++
    ) {
      const step = graph.seq[stepn]
      if (stepn !== firstIndex && step.type === 'run') {
        addFifo({
          step: graph,
          firstIndex: stepn,
          scope,
          resetStop,
          type: 'effect',
          id: ++layerID,
        })
        return
      }
      const cmd = command[step.type]
      const local = new Local(scope.value)
      //$todo
      scope.value = cmd(meta, local, step.data)
      if (local.isFailed) {
        meta.stop = true
      } else if (!local.isChanged) {
        meta.stop = true
      } else {
        meta.stop = false
      }
    }
    if (!meta.stop) {
      for (let stepn = 0; stepn < graph.next.length; stepn++) {
        /**
         * copy head of scope stack to feel free
         * to override it during seq execution
         */
        const subscope = new Stack(scope.value, scope)
        addFifo({
          step: graph.next[stepn],
          firstIndex: 0,
          scope: subscope,
          resetStop: true,
          type: 'layer',
          id: ++layerID,
        })
      }
    }
    if (resetStop) {
      meta.stop = false
    }
  }
  const meta = {
    pendingEvents,
    stop: false,
    val: step.val,
  }

  runFifo()
}
const command = {
  emit: (meta, local, step: $PropertyType<Emit, 'data'>) => local.arg,
  filter(meta, local, step: $PropertyType<Filter, 'data'>) {
    const runCtx = tryRun({
      arg: local.arg,
      val: meta.val,
      fn: step.fn,
    })
    /**
     * .isFailed assignment is not needed because in such case
     * runCtx.result will be null
     * thereby successfully forcing that branch to stop
     */
    local.isChanged = Boolean(runCtx.result)
    return local.arg
  },
  run(meta, local, step: $PropertyType<Run, 'data'>) {
    if ('pushUpdate' in step) {
      step.pushUpdate = data => meta.pendingEvents.push(data)
    }
    const runCtx = tryRun({
      arg: local.arg,
      val: meta.val,
      fn: step.fn,
    })
    local.isFailed = runCtx.err
    return runCtx.result
  },
  update(meta, local, step: $PropertyType<Update, 'data'>) {
    return (step.store.current = local.arg)
  },
  compute(meta, local, step: $PropertyType<Compute, 'data'>) {
    const runCtx = tryRun({
      arg: local.arg,
      val: meta.val,
      fn: step.fn,
    })
    local.isFailed = runCtx.err
    return runCtx.result
  },
}
const tryRun = ctx => {
  const result = {
    err: false,
    result: null,
  }
  try {
    result.result = ctx.fn.call(null, ctx.arg, ctx.val)
  } catch (err) {
    console.error(err)
    result.err = true
  }
  return result
}
