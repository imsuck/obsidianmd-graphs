# Input

obsidian vault (you don't have to enable explicit obsidian dependencies, just parse the `.md` files)

# Process

- Parse front matter (may contain wikilinks)
- Process wikilinks (can be configured as absolute or relative)

# Output

A web page served through a simple https server

# Requirements

- Don't over engineer.
- Use typescript, pnpm, svelte.
- Has options for handling tags. Nested tags should also be considered. Treat nested
  tags, configurably, as either single objects of their own or deeper tags link
  out to parent tag, e.g. #physics/em should have #em -> #physics
  It's okay to treat duplicate tags in different levels as the same node (they kind of are).
- Handle basic graph analytic algorithms:
  + Local graphs: Co-citation, Adamic-Adar, etc.
  + Global graphs: Louvain, Leiden, etc.
- For local graph algorithms, the user selects a node from the 3d.js canvas. This sends a signal to the renderer
  to create a popup component in the top right corner showing related notes along with the value from the algorithm.
- For global graph algorithms, the component will be colored using a coherent colorcheme picked through oklch

