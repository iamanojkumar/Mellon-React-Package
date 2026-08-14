---
'@mellon-design/react': minor
---

Canvas phase 3: `aiCluster` affinity mapping.

`Canvas` gains `aiCluster`, which adds a "Group by theme" trigger: the notes
are read, grouped by meaning, and each group is framed with its members laid
out inside. Like `aiPrompt` it renders nothing without an `AIProvider` or a
`resolveClusters` of your own, and it always stages the result for review —
clustering rearranges work the user arranged themselves.

The model is asked only which blocks belong together, never where to put them.
Placement is the new pure `clusterCommands` (`src/utilities/canvasClusters.ts`),
which lays out a grid per frame clear of everything that isn't moving and never
resizes a block. Groups are validated like commands are: an unknown id, or a
block claimed by two groups, is dropped and reported.

Also exported: `normalizeCanvasClusters`, `parseCanvasClusterResolution`,
`buildCanvasClusterPrompt`, `clusterCandidates`/`isClusterCandidate`,
`DEFAULT_CLUSTER_LAYOUT`, and `useCanvasCommands`' new `cluster`/
`clusterAvailable`.
