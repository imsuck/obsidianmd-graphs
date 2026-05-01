# Obsidian graph analysis

> [!warning] AI Warning
> This was written using sloppy models. User discretion advised!
> However, your data is local and read-only. No worries about that sort of privacy issue.

## Download

- Go to the top of the page
- Click on the green `< > Code` button
- Download ZIP

## Fetch dependencies

- Make sure you have [node](https://nodejs.org/en/download/) and [pnpm](https://pnpm.io/installation) installed
- `pnpm i`

## Start the server

- Run `pnpm start`
- Visit http://localhost:4173 and enjoy the magic

## TODO: Graph Algorithms

We plan to implement the following additional graph analytic algorithms in the future:

- [x] **PageRank**: Measure the relative importance of notes based on link structure.
- [ ] **Node2Vec**: Generate continuous vector embeddings for notes based on network structure.
- [ ] **Walktrap**: Community detection using short random walks.
- [ ] Highlight nodes in the same community when hovering over a node.
