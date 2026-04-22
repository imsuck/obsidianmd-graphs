# Obsidian graph analysis

## Download

- Go to the top of the page
- Click on the green `< > Code` button
- Download ZIP

## Fetch dependencies

- Make sure you have [node](https://nodejs.org/en/download/) and [pnpm](https://pnpm.io/installation) installed
- `pnpm i`

## Start the server

- Run `pnpm dev`
- Visit http://localhost:5173 and enjoy the magic

## TODO: Graph Algorithms

We plan to implement the following additional graph analytic algorithms in the future:

- [x] **PageRank**: Measure the relative importance of notes based on link structure.
- [ ] **Betweenness Centrality**: Identify "bridge" notes that connect disparate parts of the knowledge graph.
- [ ] **Tarjan's Strongly Connected Components**: Find cycles and clusters of tightly interwoven notes.
- [ ] **Node2Vec**: Generate continuous vector embeddings for notes based on network structure.
- [ ] **Walktrap**: Community detection using short random walks.
